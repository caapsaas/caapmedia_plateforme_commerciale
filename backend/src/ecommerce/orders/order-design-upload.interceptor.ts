import type { Request } from 'express';
import type { Dirent } from 'fs';
import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  PayloadTooLargeException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { extname, join, resolve } from 'path';
import { catchError, defer, switchMap, finalize } from 'rxjs';

export const ORDER_FILE_LIMIT = 10 * 1024 * 1024;
const MIME_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};
const staging = resolve(process.cwd(), 'private', 'order-uploads');
const destination = resolve(process.cwd(), 'public', 'order_item_img');

export function validateDesignHeader(extension: string, header: Buffer): void {
  const valid =
    extension === '.pdf'
      ? header.subarray(0, 5).toString() === '%PDF-'
      : extension === '.png'
        ? header
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : ['.jpg', '.jpeg'].includes(extension)
          ? header.subarray(0, 3).equals(Buffer.from([255, 216, 255]))
          : extension === '.webp' &&
            header.subarray(0, 4).toString() === 'RIFF' &&
            header.subarray(8, 12).toString() === 'WEBP';
  if (!valid)
    throw new BadRequestException(
      'Le contenu du fichier ne correspond pas au format autorisé.',
    );
}

async function storageSize(directory: string): Promise<number> {
  let entries: Dirent[];
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return 0;
    throw error;
  }
  let total = 0;
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) total += await storageSize(path);
    else if (entry.isFile()) total += (await fs.stat(path)).size;
  }
  return total;
}

function quotaBytes(name: string, defaultMb: number): number {
  const mb = Number(process.env[name] ?? defaultMb);
  if (!Number.isFinite(mb) || mb <= 0) throw new Error(`Invalid ${name}`);
  return mb * 1024 * 1024;
}

// Serializes quota checks and publication in this API process.
let publication: Promise<void> = Promise.resolve();
let activeUploads = 0;
async function publish(files: Express.Multer.File[], subsidiaryId: string) {
  if (!files.length) return;
  if (!/^[a-zA-Z0-9_-]+$/.test(subsidiaryId))
    throw new BadRequestException('Filiale invalide.');
  for (const file of files) {
    const handle = await fs.open(file.path, 'r');
    try {
      const header = Buffer.alloc(12);
      await handle.read(header, 0, 12, 0);
      validateDesignHeader(extname(file.originalname).toLowerCase(), header);
    } finally {
      await handle.close();
    }
  }
  const previous = publication;
  let release!: () => void;
  publication = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous;
  try {
    const tenantDirectory = join(destination, subsidiaryId);
    const addedSize = files.reduce((sum, file) => sum + file.size, 0);
    const [globalSize, tenantSize] = await Promise.all([
      storageSize(destination),
      storageSize(tenantDirectory),
    ]);
    if (
      globalSize + addedSize >
        quotaBytes('ORDER_UPLOAD_GLOBAL_QUOTA_MB', 5120) ||
      tenantSize + addedSize >
        quotaBytes('ORDER_UPLOAD_SUBSIDIARY_QUOTA_MB', 1024)
    ) {
      throw new PayloadTooLargeException(
        'Quota de stockage des fichiers de commande atteint.',
      );
    }
    await fs.mkdir(tenantDirectory, { recursive: true, mode: 0o755 });
    for (const file of files) {
      const filename = `${randomUUID()}${extname(file.originalname).toLowerCase()}`;
      const target = join(tenantDirectory, filename);
      await fs.rename(file.path, target);
      file.path = target;
      file.filename = `${subsidiaryId}/${filename}`;
    }
  } finally {
    release();
  }
}

const Multipart = FileFieldsInterceptor(
  [{ name: 'designFiles', maxCount: 10 }],
  {
    storage: diskStorage({
      destination: (_req, _file, callback) => {
        void fs.mkdir(staging, { recursive: true, mode: 0o700 }).then(
          () => callback(null, staging),
          (error: Error) => callback(error, staging),
        );
      },
      filename: (_req, _file, callback) => callback(null, randomUUID()),
    }),
    limits: {
      fileSize: ORDER_FILE_LIMIT,
      files: 10,
      fields: 20,
      parts: 30,
      fieldSize: 1024 * 1024,
    },
    fileFilter: (_req, file, callback) => {
      if (
        MIME_TYPES[extname(file.originalname).toLowerCase()] !==
          file.mimetype ||
        !MIME_TYPES[extname(file.originalname).toLowerCase()]
      ) {
        return callback(
          new BadRequestException(
            'Formats autorisés : PDF, PNG, JPEG et WebP.',
          ),
          false,
        );
      }
      callback(null, true);
    },
  },
);

@Injectable()
export class OrderDesignUploadInterceptor implements NestInterceptor {
  private readonly multipart = new Multipart();

  async intercept(context: ExecutionContext, next: CallHandler) {
    if (activeUploads >= 4)
      throw new HttpException(
        'Trop de transferts simultanés.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    activeUploads++;
    try {
      // Reserve room for all four bounded multipart requests plus server headroom.
      const disk = await fs.statfs(process.cwd());
      if (disk.bavail * disk.bsize < 500 * 1024 * 1024) {
        throw new PayloadTooLargeException(
          'Espace disque insuffisant pour recevoir des fichiers.',
        );
      }
      const request = context.switchToHttp().getRequest<Request>();
      const result = await this.multipart.intercept(context, {
        handle: () => {
          const files =
            (request.files as Record<string, Express.Multer.File[]> | undefined)
              ?.designFiles ?? [];
          return defer(() => publish(files, request.user.subsidiaryId)).pipe(
            switchMap(() => next.handle()),
            catchError((error: unknown) =>
              defer(async () => {
                await Promise.all(
                  files.map((file) => fs.rm(file.path, { force: true })),
                );
                throw error;
              }),
            ),
          );
        },
      });
      return result.pipe(
        finalize(() => {
          activeUploads--;
        }),
      );
    } catch (error) {
      activeUploads--;
      throw error;
    }
  }
}
