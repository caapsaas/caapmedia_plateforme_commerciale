import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { promises as fs } from 'fs';
import { PrivateDocumentsService } from './private-documents.service';
import { PrismaService } from '../utils/prisma/prisma.service';
import { PRIVATE_DOCUMENT_ROOT } from '../utils/document-storage';
import { join } from 'path';

describe('Private document authorization', () => {
  const prisma = {
    meeting: { findFirst: jest.fn() },
    companyDocument: { findFirst: jest.fn() },
    employeeDocument: { findMany: jest.fn() },
  };
  const service = new PrivateDocumentsService(
    prisma as unknown as PrismaService,
  );
  const hr = { subsidiaryId: 'branch-A', role: UserRole.HR_MANAGER };
  const secretary = { subsidiaryId: 'branch-A', role: UserRole.SECRETARY };

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    prisma.employeeDocument.findMany.mockResolvedValue([]);
    prisma.companyDocument.findFirst.mockResolvedValue({
      subsidiaryId: 'branch-A',
    });
    jest
      .spyOn(fs, 'realpath')
      .mockImplementation((path) => Promise.resolve(String(path)));
    jest
      .spyOn(fs, 'stat')
      .mockResolvedValue({ isFile: () => true } as Awaited<
        ReturnType<typeof fs.stat>
      >);
  });

  it('allows HR to read a legacy employee document in its branch', async () => {
    prisma.employeeDocument.findMany.mockResolvedValue([
      { employee: { subsidiaryId: 'branch-A' } },
    ]);
    await expect(
      service.resolveFile('employee-documents', 'contract.pdf', undefined, hr),
    ).resolves.toBe(
      join(PRIVATE_DOCUMENT_ROOT, 'employee-documents', 'contract.pdf'),
    );
  });

  it('rejects foreign employee documents and foreign pending uploads', async () => {
    prisma.employeeDocument.findMany.mockResolvedValue([
      { employee: { subsidiaryId: 'branch-B' } },
    ]);
    await expect(
      service.resolveFile('employee-documents', 'contract.pdf', undefined, hr),
    ).rejects.toBeInstanceOf(ForbiddenException);
    prisma.employeeDocument.findMany.mockResolvedValue([]);
    await expect(
      service.resolveFile('employee-documents', 'pending.pdf', 'branch-B', hr),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows local pending uploads but never unlinked legacy documents', async () => {
    await expect(
      service.resolveFile('employee-documents', 'pending.pdf', 'branch-A', hr),
    ).resolves.toContain('pending.pdf');
    await expect(
      service.resolveFile('employee-documents', 'unlinked.pdf', undefined, hr),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('checks the document branch even for a local administrator', async () => {
    prisma.companyDocument.findFirst.mockResolvedValue({
      subsidiaryId: 'branch-B',
    });
    await expect(
      service.resolveFile('secretariat', 'contract.pdf', undefined, {
        ...secretary,
        role: UserRole.ADMIN,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows a super administrator to read a foreign document', async () => {
    prisma.companyDocument.findFirst.mockResolvedValue({
      subsidiaryId: 'branch-B',
    });
    await expect(
      service.resolveFile('secretariat', 'contract.pdf', undefined, {
        ...secretary,
        role: UserRole.SUPER_ADMIN,
      }),
    ).resolves.toContain('contract.pdf');
  });

  it('rejects a switched role without document permissions', async () => {
    await expect(
      service.resolveFile('employee-documents', 'contract.pdf', undefined, {
        ...hr,
        activeRole: UserRole.COMMERCIAL,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.employeeDocument.findMany).not.toHaveBeenCalled();
  });

  it.each(['../secret.pdf', 'a/b.pdf', 'a\\b.pdf', '%2e%2e', '..'])(
    'rejects unsafe filename %s',
    async (filename) => {
      await expect(
        service.resolveFile('secretariat', filename, undefined, secretary),
      ).rejects.toBeInstanceOf(NotFoundException);
    },
  );

  it('rejects symlinks escaping the private storage root', async () => {
    jest
      .spyOn(fs, 'realpath')
      .mockResolvedValueOnce(PRIVATE_DOCUMENT_ROOT)
      .mockResolvedValueOnce(join(PRIVATE_DOCUMENT_ROOT, '..', 'outside.pdf'));
    await expect(
      service.resolveFile('secretariat', 'contract.pdf', undefined, secretary),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('protects meeting reports with the same role and branch boundaries', async () => {
    prisma.meeting.findFirst.mockResolvedValue({ subsidiaryId: 'branch-A' });
    await expect(
      service.resolveFile(
        'meeting-reports',
        'report.pdf',
        undefined,
        secretary,
      ),
    ).resolves.toContain('report.pdf');
    await expect(
      service.resolveFile('meeting-reports', 'report.pdf', undefined, hr),
    ).rejects.toBeInstanceOf(ForbiddenException);
    prisma.meeting.findFirst.mockResolvedValue({ subsidiaryId: 'branch-B' });
    await expect(
      service.resolveFile(
        'meeting-reports',
        'report.pdf',
        undefined,
        secretary,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    prisma.meeting.findFirst.mockResolvedValue(null);
    await expect(
      service.resolveFile(
        'meeting-reports',
        'report.pdf',
        undefined,
        secretary,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('moves legacy documents before startup without overwriting files', async () => {
    jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
    jest.spyOn(fs, 'readdir').mockResolvedValue(['legacy.pdf'] as never);
    jest
      .spyOn(fs, 'lstat')
      .mockRejectedValue(Object.assign(new Error(), { code: 'ENOENT' }));
    const rename = jest.spyOn(fs, 'rename').mockResolvedValue(undefined);
    await service.onModuleInit();
    expect(rename).toHaveBeenCalledWith(
      join(process.cwd(), 'public', 'employee-documents', 'legacy.pdf'),
      join(PRIVATE_DOCUMENT_ROOT, 'employee-documents', 'legacy.pdf'),
    );
    expect(rename).toHaveBeenCalledWith(
      join(process.cwd(), 'public', 'uploads', 'secretariat', 'legacy.pdf'),
      join(PRIVATE_DOCUMENT_ROOT, 'secretariat', 'legacy.pdf'),
    );
  });

  it('fails startup on a migration collision instead of losing a document', async () => {
    jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
    jest.spyOn(fs, 'readdir').mockResolvedValue(['legacy.pdf'] as never);
    jest.spyOn(fs, 'lstat').mockResolvedValue({} as never);
    const rename = jest.spyOn(fs, 'rename').mockResolvedValue(undefined);
    await expect(service.onModuleInit()).rejects.toThrow('migration collision');
    expect(rename).not.toHaveBeenCalled();
  });
});

afterAll(() => jest.restoreAllMocks());
