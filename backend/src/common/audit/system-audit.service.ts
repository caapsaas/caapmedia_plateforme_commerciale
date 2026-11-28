import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../utils/prisma/prisma.service';
import { LoggerService } from '../utils/logger/logger.service';

export interface SystemAuditEntry {
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  subsidiaryId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

export interface SystemAuditQuery {
  action?: string;
  entityType?: string;
  subsidiaryId?: string;
  actorEmail?: string;
  startDate?: string;
  endDate?: string;
  take?: number;
  skip?: number;
}

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 50;

/**
 * Piste d'audit metier globale (Lot 1) : trace qui a fait quoi, sur quelle
 * entite et quand. Best-effort par defaut afin qu'un incident de log ne bloque
 * pas une operation metier deja validee, tout en acceptant un client
 * transactionnel `tx` quand l'ecriture doit etre atomique.
 */
@Injectable()
export class SystemAuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async log(
    entry: SystemAuditEntry,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    try {
      await client.systemAuditLog.create({
        data: {
          actorId: entry.actorId ?? null,
          actorEmail: entry.actorEmail ?? null,
          actorRole: entry.actorRole ? String(entry.actorRole) : null,
          subsidiaryId: entry.subsidiaryId ?? null,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId ?? null,
          summary: entry.summary,
          metadata: (entry.metadata ?? undefined) as
            | Prisma.InputJsonValue
            | undefined,
          ipAddress: entry.ipAddress ?? null,
        },
      });
    } catch (error) {
      this.logger.error(
        `Echec d'ecriture SystemAuditLog (${entry.action}): ${error}`,
        'SystemAuditService',
      );
    }
  }

  async findMany(query: SystemAuditQuery) {
    const take = Math.min(
      Math.max(query.take ?? DEFAULT_PAGE_SIZE, 1),
      MAX_PAGE_SIZE,
    );
    const skip = Math.max(query.skip ?? 0, 0);

    const where: Prisma.SystemAuditLogWhereInput = {
      ...(query.action ? { action: query.action } : {}),
      ...(query.entityType ? { entityType: query.entityType } : {}),
      ...(query.subsidiaryId ? { subsidiaryId: query.subsidiaryId } : {}),
      ...(query.actorEmail
        ? { actorEmail: { contains: query.actorEmail, mode: 'insensitive' } }
        : {}),
    };

    if (query.startDate || query.endDate) {
      where.createdAt = {
        ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
        ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
      };
    }

    const [entries, total] = await Promise.all([
      this.prisma.systemAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.systemAuditLog.count({ where }),
    ]);

    return { entries, total, take, skip };
  }
}
