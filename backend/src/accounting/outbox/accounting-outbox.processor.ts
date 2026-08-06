import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { AccountingOutboxStatus, Prisma } from '@prisma/client';
import { JournalizationService } from '../journalization/journalization.service';

/**
 * Processeur Outbox - Pattern transactionnel pour intégrité comptable
 *
 * Responsabilités :
 * 1. Traiter les entrées PENDING (asynchrone, en arrière-plan)
 * 2. Dispatcher vers les handlers spécialisés selon eventType
 * 3. Gérer la retry logic (max 5 tentatives, attendre 20s entre retry)
 * 4. Tracer les erreurs pour diagnostic
 *
 * Garanties :
 * - Si fiche de paie créée → intention comptable sera TRAITÉE (jamais perdue)
 * - Si erreur réseau/API → retry automatique
 * - Si erreur persistante → FAILED (action manuelle requise)
 *
 * Cron : Toutes les 20 secondes (configurable)
 */
@Injectable()
export class AccountingOutboxProcessor {
  private readonly logger = new Logger(AccountingOutboxProcessor.name);

  // Configuration
  private readonly MAX_ATTEMPTS = 5;
  private readonly BATCH_SIZE = 50; // Traiter max 50 par run

  constructor(
    private readonly prisma: PrismaService,
    private readonly journalizationService: JournalizationService,
  ) {}

  // Cron job : Traiter les entrées en attente (toutes les 20 secondes)
  @Cron('*/20 * * * * *')
  async processPending(): Promise<void> {
    this.logger.debug('🔄 Outbox processor - cycle de traitement');

    try {
      // 1. Récupérer les entrées PENDING
      const pending = await this.prisma.accountingOutboxEntry.findMany({
        where: {
          status: AccountingOutboxStatus.PENDING,
          attempts: { lt: this.MAX_ATTEMPTS },
        },
        take: this.BATCH_SIZE,
        orderBy: { createdAt: 'asc' }, // FIFO
      });

      if (pending.length === 0) {
        this.logger.debug('✅ Aucune entrée en attente');
        return;
      }

      this.logger.log(`📋 ${pending.length} entrée(s) à traiter`);

      // 2. Traiter chaque entrée
      let successCount = 0;
      let failureCount = 0;

      for (const entry of pending) {
        try {
          await this.processEntry(entry);
          successCount++;
        } catch (error) {
          failureCount++;
          await this.handleError(entry, error);
        }
      }

      this.logger.log(
        `✅ Cycle terminé: ${successCount} succès, ${failureCount} erreurs`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Erreur critique dans outbox processor: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Ne pas relancer - le cron job continuera à la prochaine exécution
    }
  }

  /**
   * Traiter une entrée Outbox
   * 1. Dispatcher vers handler spécialisé
   * 2. Mettre à jour le statut
   */
  private async processEntry(
    entry: Prisma.AccountingOutboxEntryGetPayload<{}>,
  ): Promise<void> {
    this.logger.log(
      `⚙️ Traitement entry ${entry.id} - Type: ${entry.eventType}`,
    );

    // Dispatcher selon le type d'événement (passer subsidiaryId en contexte)
    await this.dispatch(entry.eventType, entry.payload, entry.subsidiaryId);

    // Marquer comme PROCESSED
    await this.prisma.accountingOutboxEntry.update({
      where: { id: entry.id },
      data: {
        status: AccountingOutboxStatus.PROCESSED,
        processedAt: new Date(),
      },
    });

    this.logger.log(`✅ Entry ${entry.id} traitée avec succès`);
  }

  /**
   * Dispatcher vers les handlers spécialisés
   * Extensible : ajouter nouveaux eventType ici
   */
  private async dispatch(
    eventType: string,
    payload: Prisma.JsonValue,
    subsidiaryId: string,
  ): Promise<void> {
    const typedPayload = payload as Record<string, any>;

    switch (eventType) {
      case 'PAYROLL_ENTRY':
        await this.handlePayrollEntry(typedPayload, subsidiaryId);
        break;

      case 'BONUS_ENTRY':
        await this.handleBonusEntry(typedPayload, subsidiaryId);
        break;

      case 'CHARGE_PAYMENT_ENTRY':
        await this.handleChargePaymentEntry(typedPayload, subsidiaryId);
        break;

      default:
        throw new Error(`Type d'événement inconnu: ${eventType}`);
    }
  }

  /**
   * Handler : Générer l'écriture comptable d'engagement de paie
   *
   * Payload: {
   *   userId: string,
   *   operationDate: string (ISO),
   *   amount: number,
   *   description: string,
   *   sourceId: string (payrollRecordId)
   * }
   */
  private async handlePayrollEntry(
    payload: Record<string, any>,
    subsidiaryId: string,
  ): Promise<void> {
    const { userId, operationDate, amount, description, sourceId } = payload;

    if (!sourceId) {
      throw new Error('sourceId (payrollRecordId) manquant dans payload PAYROLL_ENTRY');
    }

    if (!amount || amount <= 0) {
      throw new Error(`amount invalide dans payload PAYROLL_ENTRY: ${amount}`);
    }

    this.logger.log(`📝 Générer écriture comptable pour fiche ${sourceId}`);

    // Journaliser l'engagement de paie
    await this.journalizationService.journalize({
      subsidiaryId,
      userId: userId || 'system',
      operationDate: operationDate ? new Date(operationDate) : new Date(),
      amount,
      description: description || `Engagement de paie`,
      sourceType: 'PAYROLL_ACCRUAL',
      sourceId,
    });

    this.logger.log(`✅ Écriture comptable créée pour fiche ${sourceId}`);
  }

  /**
   * Handler : Générer l'écriture comptable de paiement de bonus
   *
   * Payload: {
   *   userId: string,
   *   operationDate: string (ISO),
   *   amount: number,
   *   description: string,
   *   sourceId: string (payrollBonusId)
   * }
   */
  private async handleBonusEntry(
    payload: Record<string, any>,
    subsidiaryId: string,
  ): Promise<void> {
    const { userId, operationDate, amount, description, sourceId } = payload;

    if (!sourceId) {
      throw new Error('sourceId (payrollBonusId) manquant dans payload BONUS_ENTRY');
    }

    if (!amount || amount <= 0) {
      throw new Error(`amount invalide dans payload BONUS_ENTRY: ${amount}`);
    }

    this.logger.log(`📝 Générer écriture comptable pour paiement bonus ${sourceId}`);

    // Journaliser le paiement du bonus
    await this.journalizationService.journalize({
      subsidiaryId,
      userId: userId || 'system',
      operationDate: operationDate ? new Date(operationDate) : new Date(),
      amount,
      description: description || `Paiement de bonus`,
      sourceType: 'BONUS_PAYMENT',
      sourceId,
    });

    this.logger.log(`✅ Écriture comptable créée pour paiement bonus ${sourceId}`);
  }

  /**
   * Handler : Générer l'écriture comptable de paiement de charge
   *
   * Payload: {
   *   userId: string,
   *   operationDate: string (ISO),
   *   amount: number,
   *   description: string,
   *   sourceId: string (chargePaymentId)
   * }
   */
  private async handleChargePaymentEntry(
    payload: Record<string, any>,
    subsidiaryId: string,
  ): Promise<void> {
    const { userId, operationDate, amount, description, sourceId } = payload;

    if (!sourceId) {
      throw new Error('sourceId (chargePaymentId) manquant dans payload CHARGE_PAYMENT_ENTRY');
    }

    if (!amount || amount <= 0) {
      throw new Error(`amount invalide dans payload CHARGE_PAYMENT_ENTRY: ${amount}`);
    }

    this.logger.log(
      `📝 Générer écriture comptable pour paiement charge ${sourceId}`,
    );

    // Journaliser le paiement de charge
    await this.journalizationService.journalize({
      subsidiaryId,
      userId: userId || 'system',
      operationDate: operationDate ? new Date(operationDate) : new Date(),
      amount,
      description: description || `Paiement de charge patronale`,
      sourceType: 'PAYROLL_CHARGE_PAYMENT',
      sourceId,
    });

    this.logger.log(
      `✅ Écriture comptable créée pour paiement charge ${sourceId}`,
    );
  }

  /**
   * Gérer les erreurs avec retry logic
   */
  private async handleError(
    entry: Prisma.AccountingOutboxEntryGetPayload<{}>,
    error: any,
  ): Promise<void> {
    const newAttempts = entry.attempts + 1;
    const errorMessage = error instanceof Error ? error.message : String(error);

    this.logger.warn(
      `⚠️ Entry ${entry.id} échouée (tentative ${newAttempts}/${this.MAX_ATTEMPTS}): ${errorMessage}`,
    );

    const newStatus =
      newAttempts >= this.MAX_ATTEMPTS
        ? AccountingOutboxStatus.FAILED
        : AccountingOutboxStatus.PENDING;

    await this.prisma.accountingOutboxEntry.update({
      where: { id: entry.id },
      data: {
        attempts: newAttempts,
        lastError: errorMessage,
        status: newStatus,
      },
    });

    if (newStatus === AccountingOutboxStatus.FAILED) {
      this.logger.error(
        `🚨 Entry ${entry.id} FAILED après ${this.MAX_ATTEMPTS} tentatives - ACTION MANUELLE REQUISE`,
      );
      // TODO: Alerter administrateur (email, Slack, monitoring)
    }
  }
}
