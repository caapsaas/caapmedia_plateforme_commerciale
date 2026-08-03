import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { UserRole, TransactionType, Prisma, AccountType } from '@prisma/client';
import { CreateTreasuryAccountDto } from './dto/create-treasury-account.dto';
import { CreateFinancialTransactionDto } from './dto/create-financial-transaction.dto';
import { UpdateTreasuryAccountDto } from './dto/update-treasury-account.dto';
import { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';
import { checkRole } from 'src/common/auth/role/check-role.util';
import {
  resolveScopeContext,
  withSubsidiaryScope,
  assertSubsidiaryAccess,
} from 'src/common/utils/subsidiary-scope';
import { AccountingOutboxService } from 'src/accounting/outbox/accounting-outbox.service';

import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';
import { paginate } from 'src/common/pagination/pagination';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';
@Injectable()
export class TreasuryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountingOutbox: AccountingOutboxService,
  ) {}

  // ================================================================= //
  //                       TREASURY ACCOUNTS                           //
  // ================================================================= //

  async createAccount(dto: CreateTreasuryAccountDto, user: JwtUser) {
    checkRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR],
      'Permission denied to create treasury accounts.',
    );

    if (dto.accountType === AccountType.COMPTE_PREFINANCEMENT) {
      const existing = await this.prisma.treasuryAccount.findFirst({
        where: {
          subsidiaryId: user.subsidiaryId,
          accountType: AccountType.COMPTE_PREFINANCEMENT,
        },
      });
      if (existing) {
        throw new BadRequestException(
          `Un compte de préfinancement existe déjà pour cette filiale (${existing.accountName}).`,
        );
      }
    }

    return this.prisma.treasuryAccount.create({
      data: {
        id: generateId(ID_PREFIXES.TREASURY),
        accountName: dto.accountName,
        balance: new Prisma.Decimal(dto.initialBalance),
        currency: dto.currency,
        accountType: dto.accountType,
        subsidiaryId: user.subsidiaryId,
      },
    });
  }

  async findAllAccounts(user: JwtUser, subsidiaryId?: string) {
    const ctx = resolveScopeContext(user);

    const accounts = await this.prisma.treasuryAccount.findMany({
      where: withSubsidiaryScope({}, ctx, subsidiaryId),
      orderBy: { accountName: 'asc' },
    });

    return accounts.map((account) => ({
      ...account,
      balance: Number(account.balance),
    }));
  }

  async findOneAccount(id: string, user: JwtUser) {
    const account = await this.prisma.treasuryAccount.findFirst({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException(
        `Treasury account with ID "${id}" not found.`,
      );
    }
    assertSubsidiaryAccess(account.subsidiaryId, resolveScopeContext(user));

    return { ...account, balance: Number(account.balance) };
  }

  async updateAccount(
    id: string,
    dto: UpdateTreasuryAccountDto,
    user: JwtUser,
  ) {
    checkRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR],
      'Permission denied to update treasury accounts.',
    );
    await this.findOneAccount(id, user);

    return this.prisma.treasuryAccount.update({ where: { id }, data: dto });
  }

  async deleteAccount(id: string, user: JwtUser) {
    checkRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR],
      'Permission denied to delete treasury accounts.',
    );

    const account = await this.prisma.treasuryAccount.findFirst({
      where: { id, subsidiaryId: user.subsidiaryId },
      include: { _count: { select: { financialTransactions: true } } },
    });

    if (!account) {
      throw new NotFoundException(
        `Treasury account with ID "${id}" not found.`,
      );
    }

    if (account._count.financialTransactions > 0) {
      throw new BadRequestException(
        'Cannot delete an account with existing transactions.',
      );
    }

    return this.prisma.treasuryAccount.delete({ where: { id } });
  }

  // ================================================================= //
  //              GESTION DES COMPTES DE PRÉFINANCEMENT               //
  // ================================================================= //

  async findPrefinancementAccount(subsidiaryId: string) {
    return this.prisma.treasuryAccount.findFirst({
      where: { subsidiaryId, accountType: AccountType.COMPTE_PREFINANCEMENT },
    });
  }

  async getOrCreatePrefinancementAccount(subsidiaryId: string, user: JwtUser) {
    const existing = await this.findPrefinancementAccount(subsidiaryId);
    if (existing) return existing;

    checkRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR],
      'Permission denied to create prefinancement accounts.',
    );

    return this.prisma.treasuryAccount.create({
      data: {
        id: generateId(ID_PREFIXES.TREASURY),
        accountName: 'Compte de Préfinancement',
        balance: new Prisma.Decimal(0),
        currency: 'XOF',
        accountType: AccountType.COMPTE_PREFINANCEMENT,
        subsidiaryId,
      },
    });
  }

  // ================================================================= //
  //                     FINANCIAL TRANSACTIONS                        //
  // ================================================================= //

  async createIncomeTransaction(
    dto: CreateFinancialTransactionDto,
    user: JwtUser,
  ) {
    return this.createTransaction(dto, user, TransactionType.RECETTE);
  }

  async createExpenseTransaction(
    dto: CreateFinancialTransactionDto,
    user: JwtUser,
  ) {
    return this.createTransaction(dto, user, TransactionType.DEPENSE);
  }

  /**
   * La vérification du solde est faite DANS la transaction Prisma pour éviter
   * la race condition entre la lecture du solde et son décrémentation.
   */
  private async createTransaction(
    dto: CreateFinancialTransactionDto,
    user: JwtUser,
    financialTransactionType: TransactionType,
  ) {
    checkRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR, UserRole.CAISSIER],
      'Permission denied to create transactions.',
    );

    const { treasuryAccountId, amount, transactionDate } = dto;
    const decimalAmount = new Prisma.Decimal(amount);

    return this.prisma.$transaction(async (tx) => {
      // Lecture du compte DANS la transaction pour éviter la race condition
      const account = await tx.treasuryAccount.findFirst({
        where: { id: treasuryAccountId, subsidiaryId: user.subsidiaryId },
      });

      if (!account) {
        throw new NotFoundException(
          `Treasury account with ID "${treasuryAccountId}" not found.`,
        );
      }

      if (financialTransactionType === TransactionType.DEPENSE) {
        if (account.balance.comparedTo(decimalAmount) < 0) {
          throw new BadRequestException(
            `Solde insuffisant sur "${account.accountName}". Solde: ${account.balance}, Montant: ${decimalAmount}.`,
          );
        }
      }

      const balanceOp =
        financialTransactionType === TransactionType.RECETTE
          ? { increment: decimalAmount }
          : { decrement: decimalAmount };

      await tx.treasuryAccount.update({
        where: { id: treasuryAccountId },
        data: { balance: balanceOp },
      });

      const transaction = await tx.financialTransaction.create({
        data: {
          description: dto.description,
          relatedDocumentId: dto.relatedDocumentId,
          amount: decimalAmount,
          financialTransactionType,
          treasuryAccountId,
          subsidiaryId: user.subsidiaryId,
          transactionDate: new Date(transactionDate),
          providerName: dto.providerName,
          providerPhone: dto.providerPhone,
        },
      });

      // Intention de journalisation posée dans la MÊME transaction (pattern
      // Outbox) : jamais perdue même si le traitement asynchrone échoue.
      await this.accountingOutbox.enqueue(tx, {
        eventType:
          financialTransactionType === TransactionType.RECETTE
            ? 'TREASURY_INCOME'
            : 'TREASURY_EXPENSE',
        subsidiaryId: user.subsidiaryId,
        payload: {
          userId: user.id,
          operationDate: new Date(transactionDate).toISOString(),
          amount: Number(decimalAmount),
          description: dto.description,
          sourceId: transaction.id,
          accountType: account.accountType,
        },
      });

      return transaction;
    });
  }

  async findAllTransactions(
    user: JwtUser,
    subsidiaryId?: string,
    paginationQuery: PaginationQueryDto = {},
  ) {
    checkRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR, UserRole.CAISSIER],
      'Permission denied to view transactions.',
    );

    const ctx = resolveScopeContext(user);
    const where = withSubsidiaryScope({}, ctx, subsidiaryId);

    return paginate(
      this.prisma.financialTransaction,
      {
        where,
        orderBy: { transactionDate: 'desc' },
        include: { treasuryAccount: { select: { accountName: true } } },
      },
      paginationQuery,
    );
  }

  async deleteTransaction(id: string, user: JwtUser) {
    checkRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR],
      'Permission denied to delete transactions.',
    );

    const transaction = await this.prisma.financialTransaction.findFirst({
      where: { id, subsidiaryId: user.subsidiaryId },
      include: { treasuryAccount: true },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID "${id}" not found.`);
    }

    return this.prisma.$transaction(async (tx) => {
      const balanceOp =
        transaction.financialTransactionType === TransactionType.RECETTE
          ? { decrement: transaction.amount }
          : { increment: transaction.amount };

      await tx.treasuryAccount.update({
        where: { id: transaction.treasuryAccountId },
        data: { balance: balanceOp },
      });

      return tx.financialTransaction.delete({ where: { id } });
    });
  }

  /**
   * Méthode exposée pour usage interne (depuis DebtsService) avec un contexte
   * de transaction Prisma existant, garantissant l'atomicité inter-services.
   */
  async createExpenseTransactionWithTx(
    tx: Prisma.TransactionClient,
    dto: CreateFinancialTransactionDto,
    subsidiaryId: string,
  ) {
    const decimalAmount = new Prisma.Decimal(dto.amount);

    const account = await tx.treasuryAccount.findFirst({
      where: { id: dto.treasuryAccountId, subsidiaryId },
    });

    if (!account) {
      throw new NotFoundException(
        `Treasury account with ID "${dto.treasuryAccountId}" not found.`,
      );
    }

    if (account.balance.comparedTo(decimalAmount) < 0) {
      throw new BadRequestException(
        `Solde insuffisant sur "${account.accountName}". Solde: ${account.balance}, Montant: ${decimalAmount}.`,
      );
    }

    await tx.treasuryAccount.update({
      where: { id: dto.treasuryAccountId },
      data: { balance: { decrement: decimalAmount } },
    });

    const transaction = await tx.financialTransaction.create({
      data: {
        id: generateId(ID_PREFIXES.TREASURY),
        description: dto.description,
        relatedDocumentId: dto.relatedDocumentId,
        amount: decimalAmount,
        financialTransactionType: TransactionType.DEPENSE,
        treasuryAccountId: dto.treasuryAccountId,
        subsidiaryId,
        transactionDate: new Date(dto.transactionDate),
        providerName: dto.providerName,
        providerPhone: dto.providerPhone,
      },
    });

    // Ne pose PAS d'intention outbox ici, volontairement : l'appelant connaît
    // le sourceType comptable exact de l'opération (dette fournisseur,
    // immobilisation...) et doit poser lui-même l'entrée `AccountingOutboxEntry`
    // adaptée — sinon on double-compte (un mouvement de trésorerie générique
    // EN PLUS de l'écriture métier précise).
    return { transaction, accountType: account.accountType };
  }
}
