import { Injectable } from '@nestjs/common';
import { AuthAuditEvent, Prisma } from '@prisma/client';
import { PrismaService } from '../../utils/prisma/prisma.service';
import { LoggerService } from '../../utils/logger/logger.service';

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 50;

export interface AuthAuditQuery {
  userId?: string;
  email?: string;
  event?: AuthAuditEvent;
  take?: number;
  skip?: number;
}

export interface AuthAuditEntry {
  userId?: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Journalise les evenements d'authentification sensibles (connexions,
 * deconnexions, 2FA, reutilisation de refresh token...) pour permettre une
 * revue de securite a posteriori. Best-effort: une erreur d'ecriture du
 * journal ne doit jamais faire echouer le flow d'authentification lui-meme.
 */
@Injectable()
export class AuthAuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async log(event: AuthAuditEvent, entry: AuthAuditEntry): Promise<void> {
    try {
      await this.prisma.authAuditLog.create({
        data: {
          event,
          userId: entry.userId,
          email: entry.email,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
        },
      });
    } catch (error) {
      this.logger.error(
        `Echec d'ecriture du journal d'audit pour ${event}: ${error}`,
        'AuthAuditService',
      );
    }
  }

  /**
   * Lecture paginee pour la revue de securite (reservee a SUPER_ADMIN, voir
   * auth.controller.ts). `take` est plafonne pour eviter une requete non
   * bornee sur une table qui grossit en continu.
   */
  async findMany(query: AuthAuditQuery) {
    const take = Math.min(query.take ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const skip = query.skip ?? 0;

    const where: Prisma.AuthAuditLogWhereInput = {
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.email
        ? { email: { contains: query.email, mode: 'insensitive' } }
        : {}),
      ...(query.event ? { event: query.event } : {}),
    };

    const [entries, total] = await Promise.all([
      this.prisma.authAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.authAuditLog.count({ where }),
    ]);

    return { entries, total, take, skip };
  }
}
