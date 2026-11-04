import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { basename, extname, join } from 'path';
import { PrismaService } from '../common/utils/prisma/prisma.service';
import {
  PRIVATE_DOCUMENT_PREFIX,
  PRIVATE_DOCUMENT_ROOT,
} from '../common/utils/document-storage';
import {
  ScopableUser,
  assertSubsidiaryAccess,
  resolveScopeContext,
} from '../common/utils/subsidiary-scope';
import { getActiveRole, isSuperAdmin } from '../common/auth/role/role-identity';

export const MEETING_REPORT_MAX_SIZE = 10 * 1024 * 1024;
export const MEETING_REPORT_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};
const PREFIX = `${PRIVATE_DOCUMENT_PREFIX}meeting-reports/`;

export function validateMeetingReport(file: Express.Multer.File): void {
  const extension = extname(file.originalname).toLowerCase();
  const buffer = file.buffer;
  if (
    !buffer?.length ||
    buffer.length > MEETING_REPORT_MAX_SIZE ||
    !MEETING_REPORT_TYPES[extension] ||
    MEETING_REPORT_TYPES[extension] !== file.mimetype
  ) {
    throw new BadRequestException(
      'Un rapport PDF ou Word de 10 Mo maximum est requis.',
    );
  }
  const valid =
    extension === '.pdf'
      ? buffer.subarray(0, 5).toString() === '%PDF-'
      : extension === '.doc'
        ? buffer
            .subarray(0, 8)
            .equals(
              Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
            )
        : isWordArchive(buffer);
  if (!valid)
    throw new BadRequestException(
      'Le contenu du rapport ne correspond pas au format annoncé.',
    );
}

function isWordArchive(buffer: Buffer): boolean {
  // Check ZIP directory entries without extracting untrusted archives.
  if (buffer.length < 4 || buffer.readUInt32LE(0) !== 0x04034b50) return false;
  const end = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (end < 0 || end + 22 > buffer.length) return false;
  const directoryEnd =
    buffer.readUInt32LE(end + 16) + buffer.readUInt32LE(end + 12);
  let offset = buffer.readUInt32LE(end + 16);
  if (directoryEnd > end) return false;
  const names = new Set<string>();
  while (offset < directoryEnd) {
    if (
      offset + 46 > directoryEnd ||
      buffer.readUInt32LE(offset) !== 0x02014b50
    )
      return false;
    const length = buffer.readUInt16LE(offset + 28);
    const entryEnd =
      offset +
      46 +
      length +
      buffer.readUInt16LE(offset + 30) +
      buffer.readUInt16LE(offset + 32);
    if (entryEnd > directoryEnd || buffer.readUInt16LE(offset + 8) & 1)
      return false;
    names.add(
      buffer.subarray(offset + 46, offset + 46 + length).toString('utf8'),
    );
    offset = entryEnd;
  }
  return (
    names.has('[Content_Types].xml') &&
    names.has('word/document.xml') &&
    ![...names].some((name) => /vbaProject\.bin$/i.test(name))
  );
}

@Injectable()
export class MeetingReportsService {
  private readonly logger = new Logger(MeetingReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async authorizedMeeting(id: string, user: ScopableUser) {
    const allowed: UserRole[] = [UserRole.ADMIN, UserRole.SECRETARY];
    if (!isSuperAdmin(user) && !allowed.includes(getActiveRole(user)))
      throw new ForbiddenException();
    const meeting = await this.prisma.meeting.findUnique({ where: { id } });
    if (!meeting) throw new NotFoundException('Réunion introuvable.');
    assertSubsidiaryAccess(meeting.subsidiaryId, resolveScopeContext(user));
    if (meeting.meetingDateTime > new Date())
      throw new BadRequestException('La réunion n’a pas encore commencé.');
    return meeting;
  }

  async complete(id: string, user: ScopableUser) {
    const meeting = await this.authorizedMeeting(id, user);
    if (meeting.completedAt) return meeting;
    await this.prisma.meeting.updateMany({
      where: { id, subsidiaryId: meeting.subsidiaryId, completedAt: null },
      data: { completedAt: new Date() },
    });
    return this.prisma.meeting.findUniqueOrThrow({ where: { id } });
  }

  async upload(
    id: string,
    file: Express.Multer.File | undefined,
    user: ScopableUser & { id: string },
  ) {
    const meeting = await this.authorizedMeeting(id, user);
    if (!meeting.completedAt)
      throw new BadRequestException(
        'Terminez la réunion avant de joindre son rapport.',
      );
    if (!file)
      throw new BadRequestException('Un fichier de rapport est requis.');
    validateMeetingReport(file);

    const filename = `${randomUUID()}${extname(file.originalname).toLowerCase()}`;
    const directory = join(PRIVATE_DOCUMENT_ROOT, 'meeting-reports');
    const path = join(directory, filename);
    await fs.mkdir(directory, { recursive: true, mode: 0o700 });
    await fs.writeFile(path, file.buffer, { flag: 'wx', mode: 0o600 });
    try {
      const updated = await this.prisma.meeting.updateMany({
        where: {
          id,
          subsidiaryId: meeting.subsidiaryId,
          completedAt: { not: null },
          minutesFileUrl: meeting.minutesFileUrl,
        },
        data: {
          minutesFileUrl: `${PREFIX}${filename}`,
          minutesFileName: basename(file.originalname.replace(/\\/g, '/'))
            .replace(/\p{Cc}/gu, '')
            .slice(0, 255),
          minutesUpdatedBy: user.id,
          minutesUpdatedAt: new Date(),
        },
      });
      if (updated.count !== 1)
        throw new ConflictException(
          'Le rapport a changé. Actualisez la réunion avant de réessayer.',
        );
    } catch (error) {
      await fs.unlink(path);
      throw error;
    }
    if (meeting.minutesFileUrl?.startsWith(PREFIX)) {
      const oldFilename = meeting.minutesFileUrl.slice(PREFIX.length);
      if (/^[a-f0-9-]{36}\.(pdf|doc|docx)$/.test(oldFilename)) {
        try {
          await fs.unlink(join(directory, oldFilename));
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
            this.logger.warn('Unable to clean up the previous meeting report.');
        }
      }
    }
    return this.prisma.meeting.findUniqueOrThrow({ where: { id } });
  }
}
