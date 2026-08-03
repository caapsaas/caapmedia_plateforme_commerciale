import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import {
  PrefinancementTransactionType,
  PrefinancementCategory,
  PrefinancementStatus,
} from '@prisma/client';
import { TreasuryService } from '../treasury/treasury.service';

import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';
import { paginate } from 'src/common/pagination/pagination';
import { FindPrefinancementTransactionsDto } from './dto/find-prefinancement-transactions.dto';
@Injectable()
export class PrefinancementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly treasuryService: TreasuryService,
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
  ) {
    const updateData: any = { ...updateDto };
    if (updateDto.initialBalance !== undefined) {
      updateData.balance = updateDto.initialBalance;
      delete updateData.initialBalance;
    }

    return this.prisma.prefinancementAccount.update({
      where: { id: accountId },
      data: updateData,
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
    const { date, ...rest } = createDto;
    return this.prisma.prefinancementTransaction.create({
      data: {
        id: crypto.randomUUID(),
        ...rest,
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
        where.date.lte = new Date(filters.endDate);
      }
    }

    return paginate(
      this.prisma.prefinancementTransaction,
      { where, orderBy: { date: 'desc' } },
      filters,
    );
  }

  async findTransactionById(id: string) {
    return this.prisma.prefinancementTransaction.findUnique({
      where: { id },
    });
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
  ) {
    const updateData: any = { ...updateDto };
    if (updateDto.date) {
      updateData.date = new Date(updateDto.date);
    }

    return this.prisma.prefinancementTransaction.update({
      where: { id },
      data: updateData,
    });
  }

  async validateTransaction(id: string) {
    // Utiliser une transaction Prisma pour garantir l'atomicité
    return this.prisma.$transaction(async (tx) => {
      // 1. Récupérer la transaction à valider
      const transaction = await tx.prefinancementTransaction.findUnique({
        where: { id },
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status !== PrefinancementStatus.EN_ATTENTE) {
        throw new Error('Only pending transactions can be validated');
      }

      // 2. Mettre à jour le statut de la transaction
      const updatedTransaction = await tx.prefinancementTransaction.update({
        where: { id },
        data: { status: PrefinancementStatus.VALIDE },
      });

      // 3. Mettre à jour le solde du compte de préfinancement
      const prefinancementAccount =
        await this.treasuryService.findPrefinancementAccount(
          transaction.subsidiaryId,
        );

      if (prefinancementAccount) {
        const balanceUpdateOperation =
          transaction.type === PrefinancementTransactionType.CREDIT
            ? { increment: transaction.amount }
            : { decrement: transaction.amount };

        await tx.treasuryAccount.update({
          where: { id: prefinancementAccount.id },
          data: { balance: balanceUpdateOperation },
        });
      }

      return updatedTransaction;
    });
  }

  async cancelTransaction(id: string) {
    // Utiliser une transaction Prisma pour garantir l'atomicité
    return this.prisma.$transaction(async (tx) => {
      // 1. Récupérer la transaction à annuler
      const transaction = await tx.prefinancementTransaction.findUnique({
        where: { id },
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status === PrefinancementStatus.ANNULE) {
        throw new Error('Transaction is already cancelled');
      }

      // 2. Si la transaction était validée, réinitialiser le solde du compte
      if (transaction.status === PrefinancementStatus.VALIDE) {
        const prefinancementAccount =
          await this.treasuryService.findPrefinancementAccount(
            transaction.subsidiaryId,
          );

        if (prefinancementAccount) {
          // Inverser l'opération de solde
          const balanceUpdateOperation =
            transaction.type === PrefinancementTransactionType.CREDIT
              ? { decrement: transaction.amount }
              : { increment: transaction.amount };

          await tx.treasuryAccount.update({
            where: { id: prefinancementAccount.id },
            data: { balance: balanceUpdateOperation },
          });
        }
      }

      // 3. Mettre à jour le statut de la transaction
      return await tx.prefinancementTransaction.update({
        where: { id },
        data: { status: PrefinancementStatus.ANNULE },
      });
    });
  }

  async deleteTransaction(id: string) {
    // Utiliser une transaction Prisma pour garantir l'atomicité
    return this.prisma.$transaction(async (tx) => {
      // 1. Récupérer la transaction à supprimer
      const transaction = await tx.prefinancementTransaction.findUnique({
        where: { id },
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // 2. Si la transaction était validée, réinitialiser le solde du compte
      if (transaction.status === PrefinancementStatus.VALIDE) {
        const prefinancementAccount =
          await this.treasuryService.findPrefinancementAccount(
            transaction.subsidiaryId,
          );

        if (prefinancementAccount) {
          // Inverser l'opération de solde
          const balanceUpdateOperation =
            transaction.type === PrefinancementTransactionType.CREDIT
              ? { decrement: transaction.amount }
              : { increment: transaction.amount };

          await tx.treasuryAccount.update({
            where: { id: prefinancementAccount.id },
            data: { balance: balanceUpdateOperation },
          });
        }
      }

      // 3. Supprimer la transaction
      return await tx.prefinancementTransaction.delete({
        where: { id },
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
