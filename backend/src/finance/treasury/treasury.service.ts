import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import {
  UserRole,
  TransactionType,
  TransactionStatus,
  TreasuryTransactionType,
  CounterpartyType,
  Prisma,
  AccountType,
} from '@prisma/client';
import { CreateTreasuryAccountDto } from './dto/create-treasury-account.dto';
import { CreateFinancialTransactionDto } from './dto/create-financial-transaction.dto';
import { UpdateTreasuryAccountDto } from './dto/update-treasury-account.dto';
import { UpdateTransactionStatusDto } from './dto/update-transaction-status.dto';
import { CreateDisbursementDto } from './dto/create-disbursement.dto';
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
        initialBalance: new Prisma.Decimal(dto.initialBalance),
        currency: dto.currency,
        accountType: dto.accountType,
        subsidiaryId: user.subsidiaryId,
        cashierId: dto.cashierId,
        accountCode: dto.accountCode,
        accountNumber: dto.accountNumber,
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
    // Créée EN_ATTENTE : le solde n'est débité/crédité qu'à la validation
    // (PATCH .../status) — voir updateTransactionStatus.
    const isPending = dto.status === TransactionStatus.EN_ATTENTE;

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

      if (!isPending && financialTransactionType === TransactionType.DEPENSE) {
        if (account.balance.comparedTo(decimalAmount) < 0) {
          throw new BadRequestException(
            `Solde insuffisant sur "${account.accountName}". Solde: ${account.balance}, Montant: ${decimalAmount}.`,
          );
        }
      }

      let balanceAfterSource: Prisma.Decimal | undefined;
      if (!isPending) {
        const balanceOp =
          financialTransactionType === TransactionType.RECETTE
            ? { increment: decimalAmount }
            : { decrement: decimalAmount };

        const updated = await tx.treasuryAccount.update({
          where: { id: treasuryAccountId },
          data: { balance: balanceOp },
        });
        balanceAfterSource = updated.balance;
      }

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
          status: isPending
            ? TransactionStatus.EN_ATTENTE
            : TransactionStatus.VALIDE,
          balanceAfterSource,
        },
      });

      if (!isPending) {
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
      }

      return transaction;
    });
  }

  /**
   * Valide une transaction créée EN_ATTENTE : applique le débit/crédit sur le
   * compte, fige le solde résultant, et pose l'intention de journalisation
   * comptable — rien de tout ça n'a été fait à la création (voir createTransaction).
   */
  async updateTransactionStatus(
    id: string,
    dto: UpdateTransactionStatusDto,
    user: JwtUser,
  ) {
    checkRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR],
      'Permission denied to validate transactions.',
    );

    if (dto.status !== TransactionStatus.VALIDE) {
      throw new BadRequestException(
        'Seule la transition vers VALIDE est prise en charge.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.financialTransaction.findFirst({
        where: { id, subsidiaryId: user.subsidiaryId },
        include: { treasuryAccount: true },
      });

      if (!transaction) {
        throw new NotFoundException(`Transaction with ID "${id}" not found.`);
      }

      if (transaction.status !== TransactionStatus.EN_ATTENTE) {
        throw new BadRequestException(
          'Seule une transaction EN_ATTENTE peut être validée.',
        );
      }

      if (
        transaction.financialTransactionType === TransactionType.DEPENSE &&
        transaction.treasuryAccount.balance.comparedTo(transaction.amount) < 0
      ) {
        throw new BadRequestException(
          `Solde insuffisant sur "${transaction.treasuryAccount.accountName}" pour valider ce décaissement.`,
        );
      }

      const balanceOp =
        transaction.financialTransactionType === TransactionType.RECETTE
          ? { increment: transaction.amount }
          : { decrement: transaction.amount };

      const updatedAccount = await tx.treasuryAccount.update({
        where: { id: transaction.treasuryAccountId },
        data: { balance: balanceOp },
      });

      const updatedTransaction = await tx.financialTransaction.update({
        where: { id },
        data: {
          status: TransactionStatus.VALIDE,
          balanceAfterSource: updatedAccount.balance,
        },
      });

      await this.accountingOutbox.enqueue(tx, {
        eventType:
          transaction.financialTransactionType === TransactionType.RECETTE
            ? 'TREASURY_INCOME'
            : 'TREASURY_EXPENSE',
        subsidiaryId: user.subsidiaryId,
        payload: {
          userId: user.id,
          operationDate: transaction.transactionDate.toISOString(),
          amount: Number(transaction.amount),
          description: transaction.description,
          sourceId: transaction.id,
          accountType: transaction.treasuryAccount.accountType,
        },
      });

      return updatedTransaction;
    });
  }

  // ================================================================= //
  //         DÉCAISSEMENT TYPÉ (Coffre-fort / Banque / Caisse dépense) //
  //         + VIREMENT INTER-COMPTES TRÉSORERIE                       //
  // ================================================================= //

  private static readonly CASHIER_OWNED_ACCOUNT_TYPES: AccountType[] = [
    AccountType.CAISSE,
    AccountType.CASH_REGISTER,
    AccountType.EXPENSE_BOX,
  ];

  private static readonly TRANSFER_TREASURY_TYPES: TreasuryTransactionType[] = [
    TreasuryTransactionType.BANK_WITHDRAWAL,
    TreasuryTransactionType.CASH_REFILL,
  ];

  async createDisbursement(dto: CreateDisbursementDto, user: JwtUser) {
    checkRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR, UserRole.CAISSIER],
      'Permission denied to create a disbursement.',
    );

    const isTransfer = !!dto.destinationAccountId;
    const isTransferType = TreasuryService.TRANSFER_TREASURY_TYPES.includes(
      dto.treasuryType,
    );
    if (isTransfer && !isTransferType) {
      throw new BadRequestException(
        `Le type "${dto.treasuryType}" ne correspond pas à un virement inter-comptes.`,
      );
    }
    if (!isTransfer && isTransferType) {
      throw new BadRequestException(
        'Un compte de destination est requis pour ce type de mouvement.',
      );
    }

    const decimalAmount = new Prisma.Decimal(dto.amount);
    const isPending = dto.status === TransactionStatus.EN_ATTENTE;

    return this.prisma.$transaction(async (tx) => {
      const sourceAccount = await tx.treasuryAccount.findFirst({
        where: { id: dto.sourceAccountId, subsidiaryId: user.subsidiaryId },
      });
      if (!sourceAccount) {
        throw new NotFoundException(
          `Treasury account with ID "${dto.sourceAccountId}" not found.`,
        );
      }

      // Un CAISSIER ne décaisse que depuis son propre compte assigné.
      const activeRole = user.activeRole ?? user.role;
      if (
        activeRole === UserRole.CAISSIER &&
        TreasuryService.CASHIER_OWNED_ACCOUNT_TYPES.includes(
          sourceAccount.accountType,
        ) &&
        sourceAccount.cashierId !== user.id
      ) {
        throw new ForbiddenException(
          'Vous ne pouvez décaisser que depuis votre propre compte assigné.',
        );
      }

      if (!isPending && sourceAccount.balance.comparedTo(decimalAmount) < 0) {
        throw new BadRequestException(
          `Solde insuffisant sur "${sourceAccount.accountName}".`,
        );
      }

      let destinationAccount: typeof sourceAccount | null = null;
      if (isTransfer) {
        destinationAccount = await tx.treasuryAccount.findFirst({
          where: {
            id: dto.destinationAccountId,
            subsidiaryId: user.subsidiaryId,
          },
        });
        if (!destinationAccount) {
          throw new NotFoundException(
            `Treasury account with ID "${dto.destinationAccountId}" not found.`,
          );
        }
      }

      const counterpartyId = await this.resolveCounterparty(
        tx,
        user.subsidiaryId,
        dto,
      );

      let balanceAfterSource: Prisma.Decimal | undefined;
      let balanceAfterDest: Prisma.Decimal | undefined;
      if (!isPending) {
        const updatedSource = await tx.treasuryAccount.update({
          where: { id: sourceAccount.id },
          data: { balance: { decrement: decimalAmount } },
        });
        balanceAfterSource = updatedSource.balance;

        if (destinationAccount) {
          const updatedDest = await tx.treasuryAccount.update({
            where: { id: destinationAccount.id },
            data: { balance: { increment: decimalAmount } },
          });
          balanceAfterDest = updatedDest.balance;
        }
      }

      const transaction = await tx.financialTransaction.create({
        data: {
          id: generateId(ID_PREFIXES.TREASURY),
          description: dto.description,
          amount: decimalAmount,
          financialTransactionType: TransactionType.DEPENSE,
          treasuryAccountId: sourceAccount.id,
          sourceAccountId: sourceAccount.id,
          destinationAccountId: destinationAccount?.id,
          treasuryType: dto.treasuryType,
          reference: dto.reference,
          counterpartyId,
          subsidiaryId: user.subsidiaryId,
          transactionDate: new Date(dto.transactionDate),
          status: isPending
            ? TransactionStatus.EN_ATTENTE
            : TransactionStatus.VALIDE,
          balanceAfterSource,
          balanceAfterDest,
        },
      });

      if (!isPending) {
        await this.accountingOutbox.enqueue(tx, {
          eventType: isTransfer ? 'TREASURY_TRANSFER' : 'TREASURY_EXPENSE',
          subsidiaryId: user.subsidiaryId,
          payload: {
            userId: user.id,
            operationDate: new Date(dto.transactionDate).toISOString(),
            amount: Number(decimalAmount),
            description: dto.description,
            sourceId: transaction.id,
            accountType: sourceAccount.accountType,
            destinationAccountType: destinationAccount?.accountType,
          },
        });
      }

      return transaction;
    });
  }

  private async resolveCounterparty(
    tx: Prisma.TransactionClient,
    subsidiaryId: string,
    dto: CreateDisbursementDto,
  ): Promise<string | undefined> {
    if (dto.counterpartyId) {
      const existing = await tx.counterparty.findFirst({
        where: { id: dto.counterpartyId, subsidiaryId },
      });
      if (!existing) {
        throw new NotFoundException(
          `Counterparty with ID "${dto.counterpartyId}" not found.`,
        );
      }
      return existing.id;
    }

    if (dto.newCounterpartyName) {
      const created = await tx.counterparty.create({
        data: {
          id: generateId(ID_PREFIXES.COUNTERPARTY),
          name: dto.newCounterpartyName,
          type: dto.newCounterpartyType ?? CounterpartyType.OTHER,
          subsidiaryId,
        },
      });
      return created.id;
    }

    return undefined;
  }

  /** Utilisateurs éligibles comme caissier assigné (CAISSE/CASH_REGISTER/EXPENSE_BOX) — Configuration Trésorerie. */
  async findEligibleCashiers(user: JwtUser) {
    return this.prisma.user.findMany({
      where: {
        subsidiaryId: user.subsidiaryId,
        OR: [
          { userRole: UserRole.CAISSIER },
          { roles: { has: UserRole.CAISSIER } },
          { additionalRoles: { has: UserRole.CAISSIER } },
        ],
      },
      select: { id: true, userName: true, email: true },
      orderBy: { userName: 'asc' },
    });
  }

  async findAllCounterparties(user: JwtUser, type?: CounterpartyType) {
    return this.prisma.counterparty.findMany({
      where: { subsidiaryId: user.subsidiaryId, ...(type ? { type } : {}) },
      orderBy: { name: 'asc' },
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

  /**
   * Historique des mouvements d'UN compte (Analytics par type de compte,
   * historique financier) — un mouvement apparaît ici qu'il en soit la
   * source ou la destination (virement typé, Phase B).
   */
  async findAccountTransactions(
    accountId: string,
    user: JwtUser,
    paginationQuery: PaginationQueryDto = {},
    startDate?: string,
    endDate?: string,
  ) {
    checkRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR, UserRole.CAISSIER],
      'Permission denied to view transactions.',
    );

    const account = await this.prisma.treasuryAccount.findFirst({
      where: { id: accountId },
    });
    if (!account) {
      throw new NotFoundException(
        `Treasury account with ID "${accountId}" not found.`,
      );
    }
    assertSubsidiaryAccess(account.subsidiaryId, resolveScopeContext(user));

    const where: Prisma.FinancialTransactionWhereInput = {
      OR: [
        { treasuryAccountId: accountId },
        { destinationAccountId: accountId },
      ],
    };
    if (startDate || endDate) {
      where.transactionDate = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {}),
      };
    }

    return paginate(
      this.prisma.financialTransaction,
      {
        where,
        orderBy: { transactionDate: 'desc' },
        include: {
          treasuryAccount: { select: { accountName: true } },
          destinationAccount: { select: { accountName: true } },
          counterparty: { select: { name: true } },
        },
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
      // Une transaction EN_ATTENTE n'a jamais impacté le solde (voir
      // createTransaction) — rien à réverser dans ce cas, seule une
      // transaction VALIDE doit être compensée avant suppression.
      if (transaction.status === TransactionStatus.VALIDE) {
        const balanceOp =
          transaction.financialTransactionType === TransactionType.RECETTE
            ? { decrement: transaction.amount }
            : { increment: transaction.amount };

        await tx.treasuryAccount.update({
          where: { id: transaction.treasuryAccountId },
          data: { balance: balanceOp },
        });
      }

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

    const updatedAccount = await tx.treasuryAccount.update({
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
        status: TransactionStatus.VALIDE,
        balanceAfterSource: updatedAccount.balance,
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
