import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AccountingOutboxStatus } from '@prisma/client';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import {
  JournalizationService,
  OperationSource,
} from '../journalization/journalization.service';
import { AccountingOutboxPayload } from './accounting-outbox.service';

const BATCH_SIZE = 50;
const MAX_ATTEMPTS = 5;

/**
 * Traite les intentions de journalisation posées par `AccountingOutboxService.enqueue`
 * (pattern Outbox — voir Doc/module-comptabilite-plan-implementation.md §2.3).
 * Tourne toutes les 20s, par lots de 50, pour ne jamais perdre silencieusement
 * une écriture comptable même si `JournalizationService` échoue au moment du
 * commit de l'opération métier source.
 */
@Injectable()
export class AccountingOutboxProcessor {
  private readonly logger = new Logger(AccountingOutboxProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly journalization: JournalizationService,
  ) {}

  @Cron('*/20 * * * * *')
  async processBatch(): Promise<void> {
    const batch = await this.prisma.accountingOutboxEntry.findMany({
      where: { status: AccountingOutboxStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      take: BATCH_SIZE,
    });

    for (const entry of batch) {
      try {
        const payload = entry.payload as unknown as AccountingOutboxPayload;
        await this.journalization.journalize({
          subsidiaryId: entry.subsidiaryId,
          userId: payload.userId,
          operationDate: new Date(payload.operationDate),
          amount: payload.amount,
          description: payload.description,
          sourceType: entry.eventType as OperationSource,
          sourceId: payload.sourceId,
          accountType: payload.accountType,
          expenseCategory: payload.expenseCategory,
          withTva: payload.withTva,
        });

        await this.prisma.accountingOutboxEntry.update({
          where: { id: entry.id },
          data: {
            status: AccountingOutboxStatus.PROCESSED,
            processedAt: new Date(),
          },
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        const attempts = entry.attempts + 1;
        const isDeadLetter = attempts >= MAX_ATTEMPTS;

        await this.prisma.accountingOutboxEntry.update({
          where: { id: entry.id },
          data: {
            attempts,
            lastError: error.message,
            status: isDeadLetter
              ? AccountingOutboxStatus.FAILED
              : AccountingOutboxStatus.PENDING,
          },
        });

        this.logger.error(
          `Événement outbox ${entry.id} (${entry.eventType}) — tentative ${attempts}/${MAX_ATTEMPTS}${isDeadLetter ? ' — passé en FAILED (dead-letter)' : ''} : ${error.message}`,
          error.stack,
        );
      }
    }
  }
}
