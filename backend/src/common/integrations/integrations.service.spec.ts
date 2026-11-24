import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Prisma, UserRole } from '@prisma/client';
import { ProductImageStorage } from '../../ecommerce/products/product-image-storage';
import { RoleGuard } from '../auth/role/role.guard';
import { PrismaService } from '../utils/prisma/prisma.service';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { integrationRegistry } from './integration-registry';

describe('Integration checks', () => {
  it('requires the active staff super admin role on each read endpoint', () => {
    const guard = new RoleGuard(new Reflector());
    for (const method of ['list', 'history']) {
      const handler: unknown = Object.getOwnPropertyDescriptor(
        IntegrationsController.prototype,
        method,
      )?.value;
      const context = (activeRole: UserRole) =>
        ({
          getHandler: () => handler,
          getClass: () => IntegrationsController,
          switchToHttp: () => ({
            getRequest: () => ({
              method: 'GET',
              url: '/integrations',
              user: {
                activeRole,
                roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
              },
            }),
          }),
        }) as unknown as ExecutionContext;

      expect(() => guard.canActivate(context(UserRole.ADMIN))).toThrow(
        'Insufficient permissions',
      );
      expect(guard.canActivate(context(UserRole.SUPER_ADMIN))).toBe(true);
    }
  });

  it('skips duplicate runs and stores normalized results without provider details', async () => {
    const smtpHost = process.env.SMTP_HOST;
    delete process.env.SMTP_HOST;
    const fetch = jest
      .spyOn(globalThis, 'fetch')
      .mockImplementation((input) => {
        const url = input instanceof Request ? input.url : input;
        const hostname = new URL(url).hostname;
        const status =
          hostname === 'picsum.photos'
            ? 302
            : hostname === 'www.linkedin.com'
              ? 429
              : 204;
        return Promise.resolve(new Response(null, { status }));
      });
    try {
      const tx = {
        $queryRaw: jest
          .fn()
          .mockResolvedValueOnce([{ acquired: false }])
          .mockResolvedValueOnce([{ acquired: true }])
          .mockResolvedValueOnce([{ '?column?': 1 }]),
        integrationCheck: {
          findFirst: jest.fn().mockResolvedValue(null),
          createMany: jest.fn<void, [Prisma.IntegrationCheckCreateManyArgs]>(),
          deleteMany: jest.fn(),
        },
      };
      const prisma = {
        $transaction: async (fn: (client: typeof tx) => Promise<void>) =>
          fn(tx),
      };
      const images = {
        usesR2: true,
        checkRead: jest.fn().mockRejectedValue({
          $metadata: { httpStatusCode: 403 },
          message: 'provider details',
        }),
      };
      const service = new IntegrationsService(
        prisma as unknown as PrismaService,
        new ConfigService({
          R2_AUDIT_OBJECT_KEY: 'existing-object',
          WHATSAPP_ACCESS_TOKEN: 'whatsapp-fixture-token',
          WHATSAPP_PHONE_NUMBER_ID: '123456',
          WHATSAPP_GRAPH_API_VERSION: 'v25.0',
          GEMINI_API_KEY: 'gemini-fixture-key',
        }),
        images as unknown as ProductImageStorage,
      );
      await service.runChecks();
      expect(tx.integrationCheck.createMany).not.toHaveBeenCalled();
      expect(images.checkRead).not.toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();

      await service.runChecks();
      expect(images.checkRead).toHaveBeenCalledWith(
        'existing-object',
        expect.any(AbortSignal),
      );
      expect(tx.integrationCheck.createMany.mock.calls[0][0]).toHaveProperty(
        'data',
        expect.arrayContaining([
          expect.objectContaining({
            serviceId: 'postgresql',
            status: 'passed',
          }),
          expect.objectContaining({ serviceId: 'smtp', status: 'skipped' }),
          expect.objectContaining({
            serviceId: 'r2',
            status: 'failed',
            diagnostic: 'accessDenied',
          }),
          expect.objectContaining({ serviceId: 'whatsapp', status: 'passed' }),
          expect.objectContaining({ serviceId: 'gemini', status: 'passed' }),
          expect.objectContaining({ serviceId: 'picsum', status: 'passed' }),
          expect.objectContaining({
            serviceId: 'linkedin',
            status: 'failed',
            diagnostic: 'rateLimited',
          }),
        ]),
      );
      const recorded = JSON.stringify(
        tx.integrationCheck.createMany.mock.calls,
      );
      for (const { id } of integrationRegistry)
        expect(recorded).toContain(`"serviceId":"${id}"`);
      expect(recorded).not.toContain('"serviceId":"web3forms"');
      expect(fetch).toHaveBeenCalledWith(
        'https://graph.facebook.com/v25.0/123456?fields=id',
        expect.objectContaining({
          method: 'GET',
          redirect: 'manual',
          headers: { Authorization: 'Bearer whatsapp-fixture-token' },
        }),
      );
      expect(fetch).toHaveBeenCalledWith(
        'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1',
        expect.objectContaining({
          method: 'GET',
          redirect: 'manual',
          headers: { 'x-goog-api-key': 'gemini-fixture-key' },
        }),
      );
      expect(
        fetch.mock.calls.every(
          ([, options]) =>
            options?.method === 'GET' && options?.redirect === 'manual',
        ),
      ).toBe(true);
      expect(recorded).not.toContain('whatsapp-fixture-token');
      expect(recorded).not.toContain('gemini-fixture-key');
      expect(
        JSON.stringify(tx.integrationCheck.createMany.mock.calls),
      ).not.toContain('provider details');
    } finally {
      fetch.mockRestore();
      if (smtpHost !== undefined) process.env.SMTP_HOST = smtpHost;
    }
  });
});
