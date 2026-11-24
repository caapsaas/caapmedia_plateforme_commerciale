import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { performance } from 'node:perf_hooks';
import { ProductImageStorage } from '../../ecommerce/products/product-image-storage';
import {
  createSmtpTransport,
  smtpTransportOptions,
} from '../utils/email/smtp-transport';
import { PrismaService } from '../utils/prisma/prisma.service';
import {
  CHECK_INTERVAL_MS,
  CHECK_STALE_MS,
  ConfigurationState,
  HISTORY_PAGE_SIZE,
  IntegrationId,
  integrationRegistry,
} from './integration-registry';

import {
  ProbeHttpError,
  probeHttp,
  probePublicHttp,
  publicHttpTargets,
  PublicHttpTarget,
} from './http-probes';

const checkFields = {
  id: true,
  serviceId: true,
  status: true,
  diagnostic: true,
  durationMs: true,
  checkedAt: true,
} satisfies Prisma.IntegrationCheckSelect;

const HISTORY_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly images: ProductImageStorage,
  ) {}

  private configuration(id: IntegrationId): ConfigurationState {
    switch (id) {
      case 'postgresql':
        return this.config.get<string>('DATABASE_URL')?.trim()
          ? 'configured'
          : 'incomplete';
      case 'smtp':
        try {
          smtpTransportOptions();
          return 'configured';
        } catch {
          return 'incomplete';
        }
      case 'r2':
        return this.images.usesR2 ? 'configured' : 'disabled';
      case 'whatsapp':
        return this.whatsappProbeConfig() ? 'configured' : 'incomplete';
      case 'gemini':
        return this.geminiAuditKey ? 'configured' : 'incomplete';
      default:
        return 'notApplicable';
    }
  }

  private get r2CheckKey() {
    return this.config.get<string>('R2_AUDIT_OBJECT_KEY')?.trim();
  }

  private whatsappProbeConfig() {
    const token = this.config.get<string>('WHATSAPP_ACCESS_TOKEN')?.trim();
    const phoneId =
      this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID')?.trim() ?? '';
    const version =
      this.config.get<string>('WHATSAPP_GRAPH_API_VERSION')?.trim() ?? '';
    if (!token || !/^\d+$/.test(phoneId) || !/^v\d+\.\d+$/.test(version))
      return null;
    return { token, phoneId, version };
  }

  private get geminiAuditKey() {
    return this.config.get<string>('GEMINI_API_KEY')?.trim();
  }

  private async checkWebServices() {
    const ids = Object.keys(publicHttpTargets) as PublicHttpTarget[];
    const results: Awaited<ReturnType<IntegrationsService['measure']>>[] = [];
    for (let index = 0; index < ids.length; index += 4) {
      const batch = ids.slice(index, index + 4);
      results.push(
        ...(await Promise.all(
          batch.map((id) => this.measure(id, () => probePublicHttp(id))),
        )),
      );
    }
    return results;
  }

  async list() {
    const latest = await Promise.all(
      integrationRegistry.map((entry) =>
        this.prisma.integrationCheck.findFirst({
          where: { serviceId: entry.id },
          orderBy: [{ checkedAt: 'desc' }, { id: 'desc' }],
          select: checkFields,
        }),
      ),
    );

    return integrationRegistry.map((entry, index) => {
      const configuration = this.configuration(entry.id);
      const lastCheck = latest[index];
      const checkState =
        configuration === 'incomplete' || configuration === 'disabled'
          ? 'inactive'
          : entry.id === 'r2' && !this.r2CheckKey
            ? 'requiresSetup'
            : !lastCheck || lastCheck.status === 'skipped'
              ? 'neverChecked'
              : Date.now() - lastCheck.checkedAt.getTime() > CHECK_STALE_MS
                ? 'stale'
                : lastCheck.status;
      return { ...entry, configuration, checkState, lastCheck };
    });
  }

  async history(serviceId: string, beforeId?: number) {
    if (!integrationRegistry.some((entry) => entry.id === serviceId)) {
      throw new NotFoundException();
    }
    const rows = await this.prisma.integrationCheck.findMany({
      where: {
        serviceId,
        id: beforeId === undefined ? undefined : { lt: beforeId },
      },
      orderBy: { id: 'desc' },
      take: HISTORY_PAGE_SIZE + 1,
      select: checkFields,
    });
    const checks = rows.slice(0, HISTORY_PAGE_SIZE);
    return {
      checks,
      nextBeforeId:
        rows.length > HISTORY_PAGE_SIZE
          ? checks[HISTORY_PAGE_SIZE - 1].id
          : null,
    };
  }

  @Cron('*/5 * * * *')
  async runChecks() {
    const slotStart = new Date(
      Math.floor(Date.now() / CHECK_INTERVAL_MS) * CHECK_INTERVAL_MS,
    );
    try {
      await this.prisma.$transaction(
        async (tx) => {
          // Transaction-scoped lock prevents duplicate probes across Nest instances.
          const [lock] = await tx.$queryRaw<{ acquired: boolean }[]>`
          SELECT pg_try_advisory_xact_lock(24112026, 1) AS acquired
        `;
          if (!lock?.acquired) return;
          const recent = await tx.integrationCheck.findFirst({
            where: {
              serviceId: 'postgresql',
              checkedAt: { gte: slotStart },
            },
            select: { id: true },
          });
          if (recent) return;

          const r2Key = this.r2CheckKey;
          const whatsapp = this.whatsappProbeConfig();
          const geminiKey = this.geminiAuditKey;
          const [
            database,
            smtp,
            r2,
            whatsappResult,
            geminiResult,
            publicResults,
          ] = await Promise.all([
            this.measure('postgresql', () => tx.$queryRaw`SELECT 1`),
            this.configuration('smtp') === 'configured'
              ? this.measure('smtp', async () => {
                  const options = {
                    ...smtpTransportOptions(),
                    forceAuth: true,
                    connectionTimeout: 5000,
                    greetingTimeout: 5000,
                    socketTimeout: 5000,
                  };
                  const transport = createSmtpTransport(options);
                  try {
                    await transport.verify();
                  } finally {
                    transport.close();
                  }
                })
              : this.skipped('smtp', 'configurationIncomplete'),
            this.images.usesR2 && r2Key
              ? this.measure('r2', () =>
                  this.images.checkRead(r2Key, AbortSignal.timeout(8000)),
                )
              : this.skipped(
                  'r2',
                  this.images.usesR2 ? 'missingProbeObject' : 'disabled',
                ),
            whatsapp
              ? this.measure('whatsapp', () =>
                  probeHttp(
                    `https://graph.facebook.com/${whatsapp.version}/${whatsapp.phoneId}?fields=id`,
                    {
                      headers: { Authorization: `Bearer ${whatsapp.token}` },
                    },
                  ),
                )
              : this.skipped('whatsapp', 'configurationIncomplete'),
            geminiKey
              ? this.measure('gemini', () =>
                  probeHttp(
                    'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1',
                    { headers: { 'x-goog-api-key': geminiKey } },
                  ),
                )
              : this.skipped('gemini', 'missingGeminiKey'),
            this.checkWebServices(),
          ]);

          await tx.integrationCheck.createMany({
            data: [
              database,
              smtp,
              r2,
              whatsappResult,
              geminiResult,
              ...publicResults,
            ],
          });
          await tx.integrationCheck.deleteMany({
            where: {
              checkedAt: { lt: new Date(Date.now() - HISTORY_RETENTION_MS) },
            },
          });
        },
        { timeout: 45000 },
      );
    } catch {
      this.logger.warn('Integration checks could not be recorded');
    }
  }

  private skipped(serviceId: IntegrationId, diagnostic: string) {
    return { serviceId, status: 'skipped', diagnostic, checkedAt: new Date() };
  }

  private async measure(
    serviceId: IntegrationId,
    probe: () => Promise<unknown>,
  ) {
    const started = performance.now();
    let diagnostic: string | null = null;
    try {
      await probe();
    } catch (error) {
      const failure = error as {
        code?: string;
        name?: string;
        $metadata?: { httpStatusCode?: number };
      } | null;
      const httpStatus =
        error instanceof ProbeHttpError
          ? error.status
          : failure?.$metadata?.httpStatusCode;
      if (
        failure?.code === 'EAUTH' ||
        httpStatus === 401 ||
        httpStatus === 403
      ) {
        diagnostic = 'accessDenied';
      } else if (httpStatus === 404) {
        diagnostic =
          serviceId === 'r2' ? 'probeObjectNotFound' : 'endpointNotFound';
      } else if (httpStatus === 429) {
        diagnostic = 'rateLimited';
      } else if (httpStatus !== undefined && error instanceof ProbeHttpError) {
        diagnostic = 'unexpectedHttpStatus';
      } else if (
        failure?.code === 'ETIMEDOUT' ||
        failure?.name === 'AbortError' ||
        failure?.name === 'TimeoutError'
      ) {
        diagnostic = 'timeout';
      } else {
        diagnostic = 'connectionFailed';
      }
    }
    return {
      serviceId,
      status: diagnostic ? 'failed' : 'passed',
      diagnostic,
      durationMs: Math.round(performance.now() - started),
      checkedAt: new Date(),
    };
  }
}
