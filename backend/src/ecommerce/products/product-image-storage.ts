import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PutObjectCommand,
  GetObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { validateImageFile } from '../../common/utils/image.util';

export function r2Settings(env: Record<string, string | undefined>) {
  const required = [
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME',
    'R2_PUBLIC_BASE_URL',
  ];
  for (const key of required)
    if (!env[key]?.trim())
      throw new Error(`Configuration R2 manquante : ${key}`);
  const url = new URL(env.R2_PUBLIC_BASE_URL);
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/'
  )
    throw new Error(
      'R2_PUBLIC_BASE_URL doit être une origine HTTPS publique sans chemin',
    );
  if (!/^[a-f0-9]{32}$/i.test(env.R2_ACCOUNT_ID))
    throw new Error('R2_ACCOUNT_ID invalide');
  return {
    bucket: env.R2_BUCKET_NAME,
    baseUrl: url.origin,
    client: new S3Client({
      region: 'auto',
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    }),
  };
}

export const sha256 = (body: Uint8Array) =>
  createHash('sha256').update(body).digest('hex');

/** Read back from R2: do not trust metadata alone when migrating originals. */
export async function putVerified(
  settings: ReturnType<typeof r2Settings>,
  key: string,
  body: Buffer,
  contentType: string,
) {
  await settings.client.send(
    new PutObjectCommand({
      Bucket: settings.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
      Metadata: { sha256: sha256(body) },
    }),
  );
  const stored = await settings.client.send(
    new GetObjectCommand({ Bucket: settings.bucket, Key: key }),
  );
  if (
    !stored.Body ||
    sha256(await stored.Body.transformToByteArray()) !== sha256(body)
  )
    throw new Error('Vérification du contenu R2 échouée');
  return `${settings.baseUrl}/${key}`;
}

@Injectable()
export class ProductImageStorage {
  private readonly logger = new Logger(ProductImageStorage.name);
  private readonly settings?: ReturnType<typeof r2Settings>;
  constructor(config: ConfigService) {
    const mode = config.get<string>('PRODUCT_IMAGE_STORAGE') || 'r2';
    if (mode === 'r2')
      this.settings = r2Settings(
        Object.fromEntries(
          [
            'R2_ACCOUNT_ID',
            'R2_ACCESS_KEY_ID',
            'R2_SECRET_ACCESS_KEY',
            'R2_BUCKET_NAME',
            'R2_PUBLIC_BASE_URL',
          ].map((k) => [k, config.get<string>(k)]),
        ),
      );
    else if (
      mode !== 'local' ||
      config.get<string>('NODE_ENV') === 'production'
    )
      throw new Error(
        'Le stockage local des images doit être explicitement réservé au développement',
      );
  }

  async upload(files: Express.Multer.File[] = []) {
    const result: { imageName: string; imageUrl: string }[] = [];
    for (const file of files) {
      validateImageFile(file);
      const b = file.buffer;
      const valid =
        b?.length &&
        ((file.mimetype === 'image/jpeg' &&
          b[0] === 0xff &&
          b[1] === 0xd8 &&
          b[2] === 0xff) ||
          (file.mimetype === 'image/png' &&
            b
              .subarray(0, 8)
              .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
          (file.mimetype === 'image/gif' &&
            ['GIF87a', 'GIF89a'].includes(b.subarray(0, 6).toString())) ||
          (file.mimetype === 'image/webp' &&
            b.subarray(0, 4).toString() === 'RIFF' &&
            b.subarray(8, 12).toString() === 'WEBP'));
      if (!valid)
        throw new BadRequestException(
          'Le contenu du fichier ne correspond pas au type image annoncé',
        );
    }
    for (const file of files) {
      const filename = `${randomUUID()}${extname(file.originalname).toLowerCase()}`;
      let imageUrl: string;
      if (this.settings)
        imageUrl = await putVerified(
          this.settings,
          `products/${filename}`,
          file.buffer,
          file.mimetype,
        );
      else {
        const directory = resolve(process.cwd(), 'public/products');
        await mkdir(directory, { recursive: true });
        await writeFile(resolve(directory, filename), file.buffer, {
          flag: 'wx',
        });
        imageUrl = `/public/products/${filename}`;
      }
      result.push({ imageName: file.originalname, imageUrl });
    }
    return result;
  }

  // Keep originals when images are detached or a database transaction fails.
  // Automatic deletion would also break links already shared on WhatsApp.
  retainDetached(url: string) {
    this.logger.debug(`Image conservée après détachement : ${url}`);
  }
}
