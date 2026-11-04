import {
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import request from 'supertest';
import { SecretariatController } from './secretariat.controller';
import { SecretariatService } from './secretariat.service';
import {
  MeetingReportsService,
  MEETING_REPORT_MAX_SIZE,
} from './meeting-reports.service';
import { JwtAuthGuard } from '../common/auth/jwt/jwt.guard';
import { LoggerService } from '../common/utils/logger/logger.service';

describe('Meeting report HTTP endpoints', () => {
  let app: INestApplication;
  const user = {
    id: 'secretary',
    role: UserRole.SECRETARY,
    subsidiaryId: 'branch-A',
  };
  const reports = {
    complete: jest.fn().mockResolvedValue({ completedAt: new Date() }),
    upload: jest.fn().mockResolvedValue({ minutesFileName: 'report.pdf' }),
  };
  const prefix = '/secretariat/meetings/meeting';
  const pdf = Buffer.from('%PDF-1.4\nTest report');

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [SecretariatController],
      providers: [
        { provide: SecretariatService, useValue: {} },
        { provide: MeetingReportsService, useValue: reports },
        {
          provide: LoggerService,
          useValue: { log: jest.fn(), error: jest.fn(), warn: jest.fn() },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate(context: ExecutionContext) {
          const req = context
            .switchToHttp()
            .getRequest<{
              headers: { authorization?: string };
              user: typeof user;
            }>();
          if (!req.headers.authorization) throw new UnauthorizedException();
          req.user =
            req.headers.authorization === 'Bearer commercial'
              ? { ...user, role: UserRole.COMMERCIAL }
              : user;
          return true;
        },
      })
      .compile();
    app = module.createNestApplication();
    await app.init();
  });
  beforeEach(() => jest.clearAllMocks());
  afterAll(async () => {
    await app?.close();
  });

  it('accepts one multipart report and forwards its buffer to the secured service', async () => {
    await request(app.getHttpServer())
      .post(`${prefix}/report`)
      .auth('secretary', { type: 'bearer' })
      .attach('file', pdf, {
        filename: 'report.pdf',
        contentType: 'application/pdf',
      })
      .expect(201);
    expect(reports.upload).toHaveBeenCalledWith(
      'meeting',
      expect.objectContaining({ buffer: pdf, originalname: 'report.pdf' }),
      user,
    );
  });

  it('blocks anonymous and unauthorized roles before processing a file', async () => {
    await request(app.getHttpServer()).post(`${prefix}/report`).expect(401);
    await request(app.getHttpServer())
      .post(`${prefix}/report`)
      .auth('commercial', { type: 'bearer' })
      .expect(403);
    expect(reports.upload).not.toHaveBeenCalled();
  });

  it('rejects oversized reports', async () => {
    await request(app.getHttpServer())
      .post(`${prefix}/report`)
      .auth('secretary', { type: 'bearer' })
      .attach('file', Buffer.alloc(MEETING_REPORT_MAX_SIZE + 1), {
        filename: 'report.pdf',
        contentType: 'application/pdf',
      })
      .expect(413);
    expect(reports.upload).not.toHaveBeenCalled();
  });

  it('rejects unsupported formats, extra fields and multiple files', async () => {
    await request(app.getHttpServer())
      .post(`${prefix}/report`)
      .auth('secretary', { type: 'bearer' })
      .attach('file', pdf, {
        filename: 'report.html',
        contentType: 'text/html',
      })
      .expect(400);
    await request(app.getHttpServer())
      .post(`${prefix}/report`)
      .auth('secretary', { type: 'bearer' })
      .field('subsidiaryId', 'branch-B')
      .attach('file', pdf, {
        filename: 'report.pdf',
        contentType: 'application/pdf',
      })
      .expect(400);
    await request(app.getHttpServer())
      .post(`${prefix}/report`)
      .auth('secretary', { type: 'bearer' })
      .attach('file', pdf, {
        filename: 'one.pdf',
        contentType: 'application/pdf',
      })
      .attach('file', pdf, {
        filename: 'two.pdf',
        contentType: 'application/pdf',
      })
      .expect(400);
    expect(reports.upload).not.toHaveBeenCalled();
  });

  it('delegates completion with the authenticated user', async () => {
    await request(app.getHttpServer())
      .post(`${prefix}/complete`)
      .auth('secretary', { type: 'bearer' })
      .expect(201);
    expect(reports.complete).toHaveBeenCalledWith('meeting', user);
  });
});
