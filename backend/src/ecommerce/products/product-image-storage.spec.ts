import { ConfigService } from '@nestjs/config';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import {
  ProductImageStorage,
  putVerified,
  r2Settings,
} from './product-image-storage';

const env = {
  R2_ACCOUNT_ID: 'a'.repeat(32),
  R2_ACCESS_KEY_ID: 'test-access',
  R2_SECRET_ACCESS_KEY: 'test-secret',
  R2_BUCKET_NAME: 'test-products',
  R2_PUBLIC_BASE_URL: 'https://images.example.com',
};

describe('Product image storage', () => {
  it('fails closed with missing R2 credentials instead of writing locally', () => {
    expect(() => new ProductImageStorage(new ConfigService({}))).toThrow(
      'R2_ACCOUNT_ID',
    );
  });
  it('rejects local storage in production and invalid public origins', () => {
    expect(
      () =>
        new ProductImageStorage(
          new ConfigService({
            PRODUCT_IMAGE_STORAGE: 'local',
            NODE_ENV: 'production',
          }),
        ),
    ).toThrow();
    for (const url of [
      'http://images.example.com',
      'https://images.example.com/path',
      'https://user:pass@images.example.com',
    ]) {
      expect(() => r2Settings({ ...env, R2_PUBLIC_BASE_URL: url })).toThrow();
    }
  });
  it('verifies the actual uploaded bytes and sets a public image content type', async () => {
    const settings = r2Settings(env);
    const body = Buffer.from('original');
    const send = jest
      .spyOn(settings.client, 'send')
      .mockResolvedValueOnce({} as never)
      .mockResolvedValueOnce({
        Body: { transformToByteArray: () => Promise.resolve(body) },
      } as never);
    await expect(
      putVerified(settings, 'products/test.jpg', body, 'image/jpeg'),
    ).resolves.toBe('https://images.example.com/products/test.jpg');
    expect(send.mock.calls[0][0]).toBeInstanceOf(PutObjectCommand);
    expect((send.mock.calls[0][0] as PutObjectCommand).input.ContentType).toBe(
      'image/jpeg',
    );
    settings.client.destroy();
  });
  it('does not accept corrupted reads or storage failures', async () => {
    const settings = r2Settings(env);
    const send = jest.spyOn(settings.client, 'send').mockResolvedValue({
      Body: {
        transformToByteArray: () => Promise.resolve(Buffer.from('corrupted')),
      },
    } as never);
    await expect(
      putVerified(
        settings,
        'products/a.jpg',
        Buffer.from('original'),
        'image/jpeg',
      ),
    ).rejects.toThrow('Vérification');
    send.mockRejectedValue(new Error('network unavailable') as never);
    await expect(
      putVerified(
        settings,
        'products/a.jpg',
        Buffer.from('original'),
        'image/jpeg',
      ),
    ).rejects.toThrow('network unavailable');
    settings.client.destroy();
  });
  it('rejects forged images before making any remote request', async () => {
    const storage = new ProductImageStorage(new ConfigService(env));
    await expect(
      storage.upload([
        {
          originalname: 'fake.jpg',
          mimetype: 'image/jpeg',
          size: 5,
          buffer: Buffer.from('hello'),
        } as Express.Multer.File,
      ]),
    ).rejects.toThrow('contenu');
  });
});
