import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { promises as fs } from 'fs';
import {
  MeetingReportsService,
  MEETING_REPORT_MAX_SIZE,
  validateMeetingReport,
} from './meeting-reports.service';
import { PrismaService } from '../common/utils/prisma/prisma.service';
import {
  PRIVATE_DOCUMENT_PREFIX,
  PRIVATE_DOCUMENT_ROOT,
} from '../common/utils/document-storage';
import { join } from 'path';

describe('Meeting report lifecycle and access', () => {
  const user = {
    id: 'secretary',
    role: UserRole.SECRETARY,
    subsidiaryId: 'branch-A',
  };
  const prisma = {
    meeting: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      updateMany: jest.fn(),
    },
  };
  const service = new MeetingReportsService(prisma as unknown as PrismaService);
  const file = {
    originalname: 'rapport.pdf',
    mimetype: 'application/pdf',
    buffer: Buffer.from('%PDF-1.7\nreport'),
  } as Express.Multer.File;
  let meeting: {
    id: string;
    subsidiaryId: string;
    meetingDateTime: Date;
    completedAt: Date | null;
    minutesFileUrl: string | null;
    minutes: string;
  };

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    meeting = {
      id: 'meeting',
      subsidiaryId: 'branch-A',
      meetingDateTime: new Date(Date.now() - 3600000),
      completedAt: new Date(),
      minutesFileUrl: null,
      minutes: 'Existing text',
    };
    prisma.meeting.findUnique.mockImplementation(() =>
      Promise.resolve(meeting),
    );
    prisma.meeting.findUniqueOrThrow.mockImplementation(() =>
      Promise.resolve(meeting),
    );
    prisma.meeting.updateMany.mockResolvedValue({ count: 1 });
    jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
    jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    jest.spyOn(fs, 'unlink').mockResolvedValue(undefined);
  });

  afterAll(() => jest.restoreAllMocks());

  it('requires explicit completion before allowing a report', async () => {
    meeting.completedAt = null;
    await expect(service.upload(meeting.id, file, user)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(fs.writeFile).not.toHaveBeenCalled();
    await service.complete(meeting.id, user);
    expect(prisma.meeting.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { completedAt: expect.any(Date) } }),
    );
  });

  it('cannot complete or attach a report to a future meeting', async () => {
    meeting.meetingDateTime = new Date(Date.now() + 3600000);
    await expect(service.complete(meeting.id, user)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.upload(meeting.id, file, user)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.meeting.updateMany).not.toHaveBeenCalled();
  });

  it('makes completion idempotent', async () => {
    expect(await service.complete(meeting.id, user)).toBe(meeting);
    expect(prisma.meeting.updateMany).not.toHaveBeenCalled();
  });

  it('rejects foreign meetings even for a branch administrator', async () => {
    meeting.subsidiaryId = 'branch-B';
    await expect(
      service.upload(meeting.id, file, { ...user, role: UserRole.ADMIN }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it('uses the active role rather than an inactive administrator role', async () => {
    await expect(
      service.upload(meeting.id, file, {
        ...user,
        role: UserRole.ADMIN,
        activeRole: UserRole.COMMERCIAL,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.meeting.findUnique).not.toHaveBeenCalled();
  });

  it('stores private reports and audits the author without changing written minutes', async () => {
    await service.upload(meeting.id, file, user);
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining(join(PRIVATE_DOCUMENT_ROOT, 'meeting-reports')),
      file.buffer,
      { flag: 'wx', mode: 0o600 },
    );
    expect(prisma.meeting.updateMany).toHaveBeenCalledWith({
      where: {
        id: meeting.id,
        subsidiaryId: 'branch-A',
        completedAt: { not: null },
        minutesFileUrl: null,
      },
      data: {
        minutesFileUrl: expect.stringMatching(
          /\/private-documents\/meeting-reports\/[a-f0-9-]+\.pdf$/,
        ),
        minutesFileName: 'rapport.pdf',
        minutesUpdatedBy: user.id,
        minutesUpdatedAt: expect.any(Date),
      },
    });
    expect(meeting.minutes).toBe('Existing text');
  });

  it('removes the previous file only after successful replacement', async () => {
    const name = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.pdf';
    meeting.minutesFileUrl = `${PRIVATE_DOCUMENT_PREFIX}meeting-reports/${name}`;
    await service.upload(meeting.id, file, user);
    expect(fs.unlink).toHaveBeenCalledWith(
      join(PRIVATE_DOCUMENT_ROOT, 'meeting-reports', name),
    );
    expect(prisma.meeting.updateMany.mock.invocationCallOrder[0]).toBeLessThan(
      (fs.unlink as jest.Mock).mock.invocationCallOrder[0],
    );
  });

  it('cleans up a new file on a concurrent replacement without deleting the old one', async () => {
    prisma.meeting.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.upload(meeting.id, file, user)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(fs.unlink).toHaveBeenCalledWith(
      (fs.writeFile as jest.Mock).mock.calls[0][0],
    );
  });

  it('rejects missing, empty, disguised and oversized reports before saving them', async () => {
    await expect(
      service.upload(meeting.id, undefined, user),
    ).rejects.toBeInstanceOf(BadRequestException);
    for (const buffer of [
      Buffer.alloc(0),
      Buffer.from('<html>bad</html>'),
      Buffer.alloc(MEETING_REPORT_MAX_SIZE + 1),
    ]) {
      await expect(
        service.upload(meeting.id, { ...file, buffer }, user),
      ).rejects.toBeInstanceOf(BadRequestException);
    }
    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it('rejects truncated Word archives with a validation error', () => {
    for (const buffer of [
      Buffer.from('x'),
      Buffer.from([0x50, 0x4b, 0x03, 0x04]),
    ]) {
      expect(() =>
        validateMeetingReport({
          ...file,
          originalname: 'report.docx',
          mimetype:
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          buffer,
        }),
      ).toThrow(BadRequestException);
    }
  });
});
