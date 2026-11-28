import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import {
  AccountType,
  PrefinancementTransactionType,
  PrefinancementCategory,
  PrefinancementStatus,
  Prisma,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import { TreasuryService } from '../treasury/treasury.service';
import { AccountingOutboxService } from 'src/accounting/outbox/accounting-outbox.service';
import { SystemAuditService } from 'src/common/audit/system-audit.service';

import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';
import { paginate } from 'src/common/pagination/pagination';
import { FindPrefinancementTransactionsDto } from './dto/find-prefinancement-transactions.dto';
import { endOfDateInput } from 'src/common/utils/date-period.util';
@Injectable()
export class PrefinancementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly treasuryService: TreasuryService,
    @Optional() private readonly accountingOutbox?: AccountingOutboxService,
    @Optional() private readonly systemAudit?: SystemAuditService,
  ) {}

  // --- Account Methods ---
  async createAccount(createDto: {
    accountName: string;
    initialBalance?: number;
    subsidiaryId: string;
  }) {
    return this.prisma.prefinancementAccount.create({
      data: {
        id: crypto.randomUUID(),
        accountName: createDto.accountName,
        balance: createDto.initialBalance || 0,
        subsidiaryId: createDto.subsidiaryId,
      } as any,
    });
  }

  async findAccount(subsidiaryId?: string) {
    // Récupérer le compte de trésorerie de type préfinancement
    if (!subsidiaryId) {
      return null;
    }

    const treasuryAccount =
      await this.treasuryService.findPrefinancementAccount(subsidiaryId);

    if (!treasuryAccount) {
      return null;
    }

    // Retourner les données au format attendu par le frontend
    return {
      id: treasuryAccount.id,
      accountName: treasuryAccount.accountName,
      balance: Number(treasuryAccount.balance),
      currency: treasuryAccount.currency,
      lastUpdated: new Date().toISOString(), // Utiliser la date actuelle car updatedAt n'existe pas sur TreasuryAccount
      subsidiaryId: treasuryAccount.subsidiaryId,
    };
  }

  async updateAccount(
    accountId: string,
    updateDto: {
      accountName?: string;
      initialBalance?: number;
      subsidiaryId?: string;
    },
    subsidiaryId: string,
  ) {
    return this.prisma.prefinancementAccount.update({
      where: { id: accountId, subsidiaryId },
      data: {
        accountName: updateDto.accountName,
        balance: updateDto.initialBalance,
      },
    });
  }

  // --- Transaction Methods ---
  async createTransaction(createDto: {
    date: string;
    description: string;
    amount: number;
    type: 'CREDIT' | 'DEBIT';
    category:
      | 'MATERIELS_PREMIER'
      | 'MAIN_D_OEUVRE'
      | 'ENERGIE'
      | 'TRANSPORT'
      | 'AUTRE';
    referenceNumber?: string;
    relatedOrderId?: string;
    notes?: string;
    subsidiaryId: string;
    createdBy: string;
  }) {
    const { date } = createDto;
    return this.prisma.prefinancementTransaction.create({
      data: {
        id: crypto.randomUUID(),
        description: createDto.description,
        amount: createDto.amount,
        type: createDto.type,
        category: createDto.category,
        referenceNumber: createDto.referenceNumber,
        relatedOrderId: createDto.relatedOrderId,
        notes: createDto.notes,
        subsidiaryId: createDto.subsidiaryId,
        createdBy: createDto.createdBy,
        date: new Date(date),
        status: PrefinancementStatus.EN_ATTENTE,
      } as any,
    });
  }

  async findTransactions(filters: FindPrefinancementTransactionsDto) {
    const where: any = {};

    if (filters.subsidiaryId) {
      where.subsidiaryId = filters.subsidiaryId;
    }
    if (filters.type) {
      where.type = filters.type;
    }
    if (filters.category) {
      where.category = filters.category;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.search) {
      where.OR = [
        { description: { contains: filters.search, mode: 'insensitive' } },
        { referenceNumber: { contains: filters.search, mode: 'insensitive' } },
        { notes: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.date.lte = endOfDateInput(filters.endDate);
      }
    }

    return paginate(
      this.prisma.prefinancementTransaction,
      { where, orderBy: { date: 'desc' } },
      filters,
    );
  }

  async findTransactionById(id: string, subsidiaryId: string | undefined) {
    const transaction = await this.prisma.prefinancementTransaction.findUnique({
      where: { id, subsidiaryId },
    });
    if (!transaction) throw new NotFoundException('Transaction introuvable.');
    return transaction;
  }

  async updateTransaction(
    id: string,
    updateDto: {
      date?: string;
      description?: string;
      amount?: number;
      type?: 'CREDIT' | 'DEBIT';
      category?:
        | 'MATERIELS_PREMIER'
        | 'MAIN_D_OEUVRE'
        | 'ENERGIE'
        | 'TRANSPORT'
        | 'AUTRE';
      referenceNumber?: string;
      relatedOrderId?: string;
      notes?: string;
    },
    subsidiaryId: string,
  ) {
    await this.findTransactionById(id, subsidiaryId);
    return this.prisma.prefinancementTransaction.update({
      where: { id, subsidiaryId },
      data: {
        date: updateDto.date ? new Date(updateDto.date) : undefined,
        description: updateDto.description,
        amount: updateDto.amount,
        type: updateDto.type,
        category: updateDto.category,
        referenceNumber: updateDto.referenceNumber,
        relatedOrderId: updateDto.relatedOrderId,
        notes: updateDto.notes,
      },
    });
  }

  async validateTransaction(
    id: string,
    subsidiaryId: string | undefined,
    treasuryAccountId?: string,
    validatorUserId?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.prefinancementTransaction.findUnique({
        where: { id, subsidiaryId },
      });

      if (!transaction) {
        throw new NotFoundException('Transaction introuvable.');
      }

      if (transaction.status !== PrefinancementStatus.EN_ATTENTE) {
        throw new ConflictException(
          'Seule une transaction en attente peut être validée.',
        );
      }

      const prefinancementAccount =
        await this.treasuryService.findPrefinancementAccount(
          transaction.subsidiaryId,
        );
      if (!prefinancementAccount) {
        throw new BadRequestException(
          'Aucun compte de trésorerie Préfinancement configuré pour cette filiale.',
        );
      }

      const amount = new Prisma.Decimal(transaction.amount);
      let linkedFinTxId: string | null = null;
      let usedAccountId: string = prefinancementAccount.id;

      if (transaction.type === PrefinancementTransactionType.CREDIT) {
        if (!treasuryAccountId) {
          throw new BadRequestException(
            'Sélectionnez un compte source (Coffre-fort ou Banque) pour approvisionner le préfinancement.',
          );
        }
        const sourceAccount = await tx.treasuryAccount.findFirst({
          where: {
            id: treasuryAccountId,
            subsidiaryId: transaction.subsidiaryId,
            accountType: { in: [AccountType.SAFE, AccountType.BANQUE] },
          },
        });
        if (!sourceAccount) {
          throw new BadRequestException(
            'Compte source (Coffre-fort ou Banque) introuvable dans cette filiale.',
          );
        }
        if (sourceAccount.balance.comparedTo(amount) < 0) {
          throw new BadRequestException(
            `Solde insuffisant sur "${sourceAccount.accountName}".`,
          );
        }

        const balanceBeforeSource = sourceAccount.balance;
        const balanceBeforeDest = prefinancementAccount.balance;
        const updatedSource = await tx.treasuryAccount.update({
          where: { id: sourceAccount.id },
          data: { balance: { decrement: amount } },
        });
        const updatedDest = await tx.treasuryAccount.update({
          where: { id: prefinancementAccount.id },
          data: { balance: { increment: amount } },
        });

        const finTx = await tx.financialTransaction.create({
          data: {
            id: generateId(ID_PREFIXES.TREASURY),
            description: `Approvisionnement préfinancement : ${transaction.description}`,
            amount,
            financialTransactionType: TransactionType.DEPENSE,
            treasuryAccountId: sourceAccount.id,
            sourceAccountId: sourceAccount.id,
            destinationAccountId: prefinancementAccount.id,
            relatedDocumentId: transaction.id,
            reference: transaction.referenceNumber ?? transaction.id,
            subsidiaryId: transaction.subsidiaryId,
            transactionDate: transaction.date,
            status: TransactionStatus.VALIDE,
            createdByUserId: transaction.createdBy,
            approvedByUserId: validatorUserId ?? transaction.createdBy,
            approvedAt: new Date(),
            balanceBeforeSource,
            balanceAfterSource: updatedSource.balance,
            balanceBeforeDest,
            balanceAfterDest: updatedDest.balance,
          },
        });
        linkedFinTxId = finTx.id;
        usedAccountId = sourceAccount.id;

        if (this.accountingOutbox) {
          await this.accountingOutbox.enqueue(tx, {
            eventType: 'TREASURY_TRANSFER',
            subsidiaryId: transaction.subsidiaryId,
            payload: {
              userId: validatorUserId ?? transaction.createdBy,
              operationDate: transaction.date.toISOString(),
              amount: Number(amount),
              description: finTx.description,
              sourceId: finTx.id,
              accountType: sourceAccount.accountType,
              destinationAccountType: AccountType.COMPTE_PREFINANCEMENT,
            },
          });
        }
      } else {
        if (prefinancementAccount.balance.comparedTo(amount) < 0) {
          throw new BadRequestException(
            'Solde insuffisant sur le compte Préfinancement.',
          );
        }
        const balanceBeforeSource = prefinancementAccount.balance;
        const updatedPrefin = await tx.treasuryAccount.update({
          where: { id: prefinancementAccount.id },
          data: { balance: { decrement: amount } },
        });

        const finTx = await tx.financialTransaction.create({
          data: {
            id: generateId(ID_PREFIXES.TREASURY),
            description: `Utilisation préfinancement : ${transaction.description}`,
            amount,
            financialTransactionType: TransactionType.DEPENSE,
            treasuryAccountId: prefinancementAccount.id,
            sourceAccountId: prefinancementAccount.id,
            relatedDocumentId: transaction.relatedOrderId ?? transaction.id,
            reference: transaction.referenceNumber ?? transaction.id,
            subsidiaryId: transaction.subsidiaryId,
            transactionDate: transaction.date,
            status: TransactionStatus.VALIDE,
            createdByUserId: transaction.createdBy,
            approvedByUserId: validatorUserId ?? transaction.createdBy,
            approvedAt: new Date(),
            balanceBeforeSource,
            balanceAfterSource: updatedPrefin.balance,
          },
        });
        linkedFinTxId = finTx.id;

        if (this.accountingOutbox) {
          await this.accountingOutbox.enqueue(tx, {
            eventType: 'PREFINANCEMENT_USAGE',
            subsidiaryId: transaction.subsidiaryId,
            payload: {
              userId: validatorUserId ?? transaction.createdBy,
              operationDate: transaction.date.toISOString(),
              amount: Number(amount),
              description: transaction.description,
              sourceId: finTx.id,
              category: transaction.category,
            },
          });
        }
      }

      const updatedTransaction = await tx.prefinancementTransaction.update({
        where: { id, subsidiaryId, status: transaction.status },
        data: {
          status: PrefinancementStatus.VALIDE,
          treasuryAccountId: usedAccountId,
          financialTransactionId: linkedFinTxId,
          validatedById: validatorUserId,
          validatedAt: new Date(),
        },
      });

      await this.systemAudit?.log({
        actorId: validatorUserId ?? transaction.createdBy,
        subsidiaryId: transaction.subsidiaryId,
        action: 'PREFINANCEMENT_VALIDATED',
        entityType: 'PrefinancementTransaction',
        entityId: transaction.id,
        summary: `Validation préfinancement ${transaction.type} (${Number(amount)} FCFA) : ${transaction.description}`,
        metadata: {
          type: transaction.type,
          amount: Number(amount),
          financialTransactionId: linkedFinTxId,
        },
      });

      return updatedTransaction;
    });
  }

  async cancelTransaction(
    id: string,
    subsidiaryId: string | undefined,
    actorUserId?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.prefinancementTransaction.findUnique({
        where: { id, subsidiaryId },
      });

      if (!transaction) {
        throw new NotFoundException('Transaction introuvable.');
      }

      if (transaction.status === PrefinancementStatus.ANNULE) {
        throw new ConflictException('Cette transaction est déjà annulée.');
      }

      if (transaction.status === PrefinancementStatus.VALIDE) {
        const prefinancementAccount =
          await this.treasuryService.findPrefinancementAccount(
            transaction.subsidiaryId,
          );
        const amount = new Prisma.Decimal(transaction.amount);

        if (prefinancementAccount) {
          if (transaction.type === PrefinancementTransactionType.CREDIT) {
            await tx.treasuryAccount.update({
              where: { id: prefinancementAccount.id },
              data: { balance: { decrement: amount } },
            });
            if (transaction.treasuryAccountId) {
              await tx.treasuryAccount.update({
                where: { id: transaction.treasuryAccountId },
                data: { balance: { increment: amount } },
              });
            }
          } else {
            await tx.treasuryAccount.update({
              where: { id: prefinancementAccount.id },
              data: { balance: { increment: amount } },
            });
          }
        }

        if (transaction.financialTransactionId && this.accountingOutbox) {
          await tx.financialTransaction.updateMany({
            where: { id: transaction.financialTransactionId },
            data: {
              status: TransactionStatus.REVERSED,
              isReversed: true,
              reversalReason: 'Annulation transaction préfinancement',
              reversedAt: new Date(),
              reversedByUserId: actorUserId,
            },
          });
          await this.accountingOutbox.enqueue(tx, {
            eventType: 'TRANSACTION_REVERSAL',
            subsidiaryId: transaction.subsidiaryId,
            payload: {
              userId: actorUserId ?? transaction.createdBy,
              operationDate: new Date().toISOString(),
              amount: Number(amount),
              description: `Annulation préfinancement : ${transaction.description}`,
              sourceId: `REV_${transaction.financialTransactionId}`,
              originalSourceId: transaction.financialTransactionId,
              reason: 'Annulation transaction préfinancement',
            },
          });
        }
      }

      const cancelled = await tx.prefinancementTransaction.update({
        where: { id, subsidiaryId, status: transaction.status },
        data: { status: PrefinancementStatus.ANNULE },
      });

      await this.systemAudit?.log({
        actorId: actorUserId ?? transaction.createdBy,
        subsidiaryId: transaction.subsidiaryId,
        action: 'PREFINANCEMENT_CANCELLED',
        entityType: 'PrefinancementTransaction',
        entityId: transaction.id,
        summary: `Annulation préfinancement : ${transaction.description} (ancien statut : ${transaction.status})`,
        metadata: { previousStatus: transaction.status },
      });

      return cancelled;
    });
  }

  async deleteTransaction(id: string, subsidiaryId: string) {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.prefinancementTransaction.findUnique({
        where: { id, subsidiaryId },
      });

      if (!transaction) {
        throw new NotFoundException('Transaction introuvable.');
      }

      if (transaction.status === PrefinancementStatus.VALIDE) {
        throw new ConflictException(
          'Une transaction de préfinancement validée ne peut pas être supprimée. Annulez-la pour générer une contre-passation.',
        );
      }

      return await tx.prefinancementTransaction.delete({
        where: { id, subsidiaryId },
      });
    });
  }

  // --- Statistics Method ---
  async getStatistics(subsidiaryId: string) {
    const transactions = await this.prisma.prefinancementTransaction.findMany({
      where: { subsidiaryId },
    });

    const totalCredits = transactions
      .filter(
        (t) =>
          (t.type === PrefinancementTransactionType.CREDIT &&
            t.status === PrefinancementStatus.VALIDE) ||
          t.status === PrefinancementStatus.EN_ATTENTE,
      )
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalDebits = transactions
      .filter(
        (t) =>
          t.type === PrefinancementTransactionType.DEBIT &&
          (t.status === PrefinancementStatus.VALIDE ||
            t.status === PrefinancementStatus.EN_ATTENTE),
      )
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const transactionCount = transactions.length;
    const pendingTransactions = transactions.filter(
      (t) => t.status === PrefinancementStatus.EN_ATTENTE,
    ).length;

    // Regrouper par catégorie pour les crédits
    const creditsByCategory = transactions
      .filter(
        (t) =>
          (t.type === PrefinancementTransactionType.CREDIT &&
            t.status === PrefinancementStatus.VALIDE) ||
          t.status === PrefinancementStatus.EN_ATTENTE,
      )
      .reduce(
        (acc, t) => {
          const category = t.category;
          if (!acc[category]) {
            acc[category] = { category, amount: 0, count: 0 };
          }
          acc[category].amount += Number(t.amount);
          acc[category].count += 1;
          return acc;
        },
        {} as Record<
          string,
          { category: string; amount: number; count: number }
        >,
      );

    // Regrouper par catégorie pour les débits
    const debitsByCategory = transactions
      .filter(
        (t) =>
          t.type === PrefinancementTransactionType.DEBIT &&
          (t.status === PrefinancementStatus.VALIDE ||
            t.status === PrefinancementStatus.EN_ATTENTE),
      )
      .reduce(
        (acc, t) => {
          const category = t.category;
          if (!acc[category]) {
            acc[category] = { category, amount: 0, count: 0 };
          }
          acc[category].amount += Number(t.amount);
          acc[category].count += 1;
          return acc;
        },
        {} as Record<
          string,
          { category: string; amount: number; count: number }
        >,
      );

    return {
      totalBalance: totalCredits - totalDebits,
      totalCredits,
      totalDebits,
      transactionCount,
      creditsByCategory: Object.values(creditsByCategory),
      debitsByCategory: Object.values(debitsByCategory),
    };
  }
}
