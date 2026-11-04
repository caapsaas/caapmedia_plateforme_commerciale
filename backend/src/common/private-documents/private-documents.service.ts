import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { promises as fs } from 'fs';
import { resolve, relative, isAbsolute, join } from 'path';
import { PrismaService } from '../utils/prisma/prisma.service';
import {
  PRIVATE_DOCUMENT_PREFIX,
  PRIVATE_DOCUMENT_ROOT,
} from '../utils/document-storage';
import {
  assertSubsidiaryAccess,
  resolveScopeContext,
  ScopableUser,
} from '../utils/subsidiary-scope';
import { getActiveRole, isSuperAdmin } from '../auth/role/role-identity';
import { UserRole } from '@prisma/client';

@Injectable()
export class PrivateDocumentsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Move legacy files before the HTTP server starts; DB URLs remain valid
    // through the authenticated compatibility route, never through /public.
    for (const [oldFolder, category] of [
      ['employee-documents', 'employee-documents'],
      ['uploads/secretariat', 'secretariat'],
    ]) {
      const source = resolve(process.cwd(), 'public', oldFolder);
      const target = resolve(PRIVATE_DOCUMENT_ROOT, category);
      await fs.mkdir(target, { recursive: true, mode: 0o700 });
      let entries: string[];
      try {
        entries = await fs.readdir(source);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue;
        throw error;
      }
      for (const entry of entries) {
        const destination = join(target, entry);
        // Fail closed on collisions: never overwrite an existing document.
        try {
          await fs.lstat(destination);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
          await fs.rename(join(source, entry), destination);
          continue;
        }
        throw new Error(
          `Private document migration collision: ${category}/${entry}`,
        );
      }
    }
  }

  async resolveFile(
    category: string,
    filename: string,
    subsidiaryId: string | undefined,
    user: ScopableUser,
  ) {
    const segments = [
      category,
      ...(subsidiaryId ? [subsidiaryId] : []),
      filename,
    ];
    if (
      !['employee-documents', 'secretariat', 'meeting-reports'].includes(
        category,
      ) ||
      segments.some(
        (segment) => !/^[a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+)*$/.test(segment),
      )
    ) {
      throw new NotFoundException();
    }
    const permitted: UserRole[] =
      category === 'employee-documents'
        ? [UserRole.ADMIN, UserRole.HR_MANAGER]
        : [UserRole.ADMIN, UserRole.SECRETARY];
    if (!isSuperAdmin(user) && !permitted.includes(getActiveRole(user))) {
      throw new ForbiddenException();
    }
    const suffix = segments.join('/');
    const currentUrl = `${PRIVATE_DOCUMENT_PREFIX}${suffix}`;
    const legacyUrl =
      category === 'secretariat'
        ? `/public/uploads/secretariat/${filename}`
        : `/public/${suffix}`;
    const ctx = resolveScopeContext(user);
    if (category === 'meeting-reports') {
      if (subsidiaryId) throw new NotFoundException();
      const meeting = await this.prisma.meeting.findFirst({
        where: { minutesFileUrl: currentUrl },
        select: { subsidiaryId: true },
      });
      if (!meeting) throw new NotFoundException();
      assertSubsidiaryAccess(meeting.subsidiaryId, ctx);
    } else if (category === 'secretariat') {
      if (subsidiaryId) throw new NotFoundException();
      const document = await this.prisma.companyDocument.findFirst({
        where: { fileUrl: { in: [currentUrl, legacyUrl] } },
        select: { subsidiaryId: true },
      });
      if (!document) throw new NotFoundException();
      assertSubsidiaryAccess(document.subsidiaryId, ctx);
    } else {
      const documents = await this.prisma.employeeDocument.findMany({
        where: { url: { in: [currentUrl, legacyUrl] } },
        select: { employee: { select: { subsidiaryId: true } } },
      });
      if (documents.length) {
        for (const document of documents)
          assertSubsidiaryAccess(document.employee.subsidiaryId, ctx);
      } else {
        // Pending uploads are tenant-scoped even before an employee is saved.
        if (!subsidiaryId) throw new NotFoundException();
        assertSubsidiaryAccess(subsidiaryId, ctx);
      }
    }
    try {
      const root = await fs.realpath(PRIVATE_DOCUMENT_ROOT);
      const path = await fs.realpath(resolve(root, ...segments));
      const rel = relative(root, path);
      if (
        rel.startsWith('..') ||
        isAbsolute(rel) ||
        !(await fs.stat(path)).isFile()
      )
        throw new NotFoundException();
      return path;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT')
        throw new NotFoundException();
      throw error;
    }
  }
}
