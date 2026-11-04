import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { promises as fs } from 'fs';
import { randomUUID } from 'crypto';
import { join } from 'path';
import request from 'supertest';
import { PrivateDocumentsController } from './private-documents.controller';
import { PrivateDocumentsService } from './private-documents.service';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { PrismaService } from '../utils/prisma/prisma.service';
import { LoggerService } from '../utils/logger/logger.service';
import { PRIVATE_DOCUMENT_ROOT } from '../utils/document-storage';

describe('Private document HTTP access (real JWT strategy)', () => {
  let app: INestApplication;
  const filename = `security-${randomUUID()}.txt`;
  const file = join(PRIVATE_DOCUMENT_ROOT, 'secretariat', filename);
  const originalSecret = process.env.JWT_SECRET;
  const secret = 'security-tests-only-01234567890123456789';
  const jwt = new JwtService({ secret });
  const prisma = {
    user: {
      findUnique: jest.fn(({ where }: { where: { id: string } }) => {
        const [userRole, subsidiaryId] = where.id.split(':');
        return {
          id: where.id,
          email: 'test@example.test',
          userRole,
          subsidiaryId,
          roles: [userRole],
          additionalRoles: [],
          activeRole: userRole,
        };
      }),
    },
    employee: { findUnique: jest.fn().mockResolvedValue(null) },
    companyDocument: {
      findFirst: jest.fn().mockResolvedValue({ subsidiaryId: 'branch-A' }),
    },
    employeeDocument: { findMany: jest.fn().mockResolvedValue([]) },
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = secret;
    await fs.mkdir(join(PRIVATE_DOCUMENT_ROOT, 'secretariat'), {
      recursive: true,
    });
    await fs.writeFile(file, 'confidential');
    const documents = new PrivateDocumentsService(
      prisma as unknown as PrismaService,
    );
    // Migration is tested separately: HTTP tests must not move real runtime files.
    const module = await Test.createTestingModule({
      imports: [PassportModule],
      controllers: [PrivateDocumentsController],
      providers: [
        JwtStrategy,
        {
          provide: PrivateDocumentsService,
          useValue: { resolveFile: documents.resolveFile.bind(documents) },
        },
        { provide: PrismaService, useValue: prisma },
        {
          provide: LoggerService,
          useValue: { error: jest.fn(), warn: jest.fn() },
        },
      ],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api-caapmedia');
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    await fs.unlink(file);
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  const url = `/api-caapmedia/private-documents/secretariat/${filename}`;
  function token(role: UserRole, subsidiaryId = 'branch-A') {
    return jwt.sign({ sub: `${role}:${subsidiaryId}` }, { expiresIn: '5m' });
  }

  it('rejects anonymous requests and invalid JWTs', async () => {
    await request(app.getHttpServer()).get(url).expect(401);
    await request(app.getHttpServer())
      .get(url)
      .auth('invalid', { type: 'bearer' })
      .expect(401);
  });

  it('rejects the wrong role and a valid account in another branch', async () => {
    await request(app.getHttpServer())
      .get(url)
      .auth(token(UserRole.HR_MANAGER), { type: 'bearer' })
      .expect(403);
    await request(app.getHttpServer())
      .get(url)
      .auth(token(UserRole.ADMIN, 'branch-B'), { type: 'bearer' })
      .expect(403);
  });

  it('downloads the authorized document without browser/proxy caching', async () => {
    const response = await request(app.getHttpServer())
      .get(url)
      .auth(token(UserRole.SECRETARY), { type: 'bearer' })
      .expect(200);
    expect(response.text).toBe('confidential');
    expect(response.headers['cache-control']).toBe('private, no-store');
    expect(response.headers['content-disposition']).toContain('attachment');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('never accepts a pending second-factor token as a document session', async () => {
    const pending = jwt.sign({
      sub: 'SECRETARY:branch-A',
      type: 'pending_2fa',
    });
    await request(app.getHttpServer())
      .get(url)
      .auth(pending, { type: 'bearer' })
      .expect(401);
  });
});
