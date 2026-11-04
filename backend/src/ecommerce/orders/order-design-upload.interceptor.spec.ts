import {
  BadRequestException,
  Body,
  Controller,
  INestApplication,
  Post,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { promises as fs } from 'fs';
import { randomUUID } from 'crypto';
import { resolve } from 'path';
import {
  OrderDesignUploadInterceptor,
  ORDER_FILE_LIMIT,
} from './order-design-upload.interceptor';

@Controller('upload-security-test')
class UploadTestController {
  @Post()
  @UseInterceptors(OrderDesignUploadInterceptor)
  upload(@Req() req, @Body() body: { reject?: string }) {
    if (body.reject) throw new BadRequestException('Rejected order');
    return { filename: req.files.designFiles[0].filename };
  }
}

describe('Order upload HTTP security boundaries', () => {
  let app: INestApplication;
  const subsidiaryId = `security-test-${randomUUID()}`;
  const root = resolve(process.cwd(), 'public', 'order_item_img', subsidiaryId);
  const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
  const previousQuota = process.env.ORDER_UPLOAD_SUBSIDIARY_QUOTA_MB;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [UploadTestController],
    }).compile();
    app = module.createNestApplication();
    app.use((req, _res, next) => {
      req.user = { subsidiaryId };
      next();
    });
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    // Remove only files created by this suite; never touch other tenants.
    for (const name of await fs.readdir(root).catch(() => [] as string[]))
      await fs.unlink(resolve(root, name));
    await fs.rmdir(root).catch(() => undefined);
    if (previousQuota === undefined)
      delete process.env.ORDER_UPLOAD_SUBSIDIARY_QUOTA_MB;
    else process.env.ORDER_UPLOAD_SUBSIDIARY_QUOTA_MB = previousQuota;
  });

  it('publishes a permitted design under a server-generated tenant filename', async () => {
    const response = await request(app.getHttpServer())
      .post('/upload-security-test')
      .attach('designFiles', png, {
        filename: 'design.png',
        contentType: 'image/png',
      })
      .expect(201);
    expect(response.body.filename).toMatch(
      new RegExp(`^${subsidiaryId}/[a-f0-9-]+\\.png$`),
    );
    expect(
      await fs.readFile(
        resolve(
          process.cwd(),
          'public',
          'order_item_img',
          response.body.filename,
        ),
      ),
    ).toEqual(png);
  });

  it('rejects a renamed executable before publication', async () => {
    await request(app.getHttpServer())
      .post('/upload-security-test')
      .attach('designFiles', Buffer.from('<script>bad()</script>'), {
        filename: 'fake.png',
        contentType: 'image/png',
      })
      .expect(400);
  });

  it('rejects active web formats and unexpected multipart file fields', async () => {
    await request(app.getHttpServer())
      .post('/upload-security-test')
      .attach('designFiles', png, {
        filename: 'attack.svg',
        contentType: 'image/svg+xml',
      })
      .expect(400);
    await request(app.getHttpServer())
      .post('/upload-security-test')
      .attach('unexpected', png, 'file.png')
      .expect(400);
  });

  it('rejects an oversized file and more than ten files', async () => {
    await request(app.getHttpServer())
      .post('/upload-security-test')
      .attach('designFiles', Buffer.alloc(ORDER_FILE_LIMIT + 1), {
        filename: 'large.png',
        contentType: 'image/png',
      })
      .expect(413);
    const upload = request(app.getHttpServer()).post('/upload-security-test');
    for (let index = 0; index < 11; index++)
      upload.attach('designFiles', png, {
        filename: `${index}.png`,
        contentType: 'image/png',
      });
    await upload.expect(400);
  });

  it('removes published files when the order is rejected', async () => {
    const before = await fs.readdir(root);
    await request(app.getHttpServer())
      .post('/upload-security-test')
      .field('reject', 'yes')
      .attach('designFiles', png, {
        filename: 'design.png',
        contentType: 'image/png',
      })
      .expect(400);
    expect(await fs.readdir(root)).toEqual(before);
  });

  it('enforces the subsidiary storage quota', async () => {
    process.env.ORDER_UPLOAD_SUBSIDIARY_QUOTA_MB = '0.000001';
    await request(app.getHttpServer())
      .post('/upload-security-test')
      .attach('designFiles', png, {
        filename: 'design.png',
        contentType: 'image/png',
      })
      .expect(413);
  });
});
