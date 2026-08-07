import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
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

  /** Types de compte auxquels un caissier peut être rattaché (un seul compte par caissier). */
  private static readonly CASHIER_ASSIGNABLE_TYPES: AccountType[] = [
    AccountType.CASH_REGISTER,
    AccountType.EXPENSE_BOX,
  ];

  private async validateCashierAssignment(
    cashierId: string,
    accountType: AccountType,
    excludeAccountId?: string,
  ) {
    if (!TreasuryService.CASHIER_ASSIGNABLE_TYPES.includes(accountType)) {
      throw new BadRequestException(
        "Un caissier ne peut être assigné qu'à un compte de type Caisse, Caisse de vente ou Caisse de dépense.",
      );
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: cashierId },
    });
    if (!targetUser) {
      throw new NotFoundException(
        `Utilisateur caissier avec l'ID "${cashierId}" non trouvé.`,
      );
    }

    const hasCashierRole =
      targetUser.userRole === UserRole.CAISSIER ||
      targetUser.roles?.includes(UserRole.CAISSIER) ||
      targetUser.additionalRoles?.includes(UserRole.CAISSIER);

    if (!hasCashierRole) {
      throw new BadRequestException(
        `L'utilisateur "${targetUser.userName}" n'a pas le rôle Caissier.`,
      );
    }

    const existingAssignment = await this.prisma.treasuryAccount.findFirst({
      where: {
        cashierId,
        ...(excludeAccountId ? { id: { not: excludeAccountId } } : {}),
      },
    });
    if (existingAssignment) {
      throw new ConflictException(
        `Ce caissier est déjà assigné au compte "${existingAssignment.accountName}".`,
      );
    }
  }

  async createAccount(dto: CreateTreasuryAccountDto, user: JwtUser) {
    checkRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR],
      'Permission denied to create treasury accounts.',
    );

    // Comptes Banque et Coffre-fort : trésorerie centralisée au siège, comme
    // gmo — « le super admin gère le coffre et les banques » (seul lui peut
    // ensuite y décaisser, voir createDisbursement). Un compte Banque
    // référence en plus une banque physique (tiers global, Configuration).
    let targetSubsidiaryId: string;
    if (
      dto.accountType === AccountType.BANQUE ||
      dto.accountType === AccountType.SAFE
    ) {
      if (dto.accountType === AccountType.BANQUE && !dto.bankId) {
        throw new BadRequestException(
          'La banque est requise pour un compte de type Banque.',
        );
      }
      if (dto.accountType === AccountType.BANQUE) {
        const bank = await this.prisma.bank.findUnique({
          where: { id: dto.bankId },
        });
        if (!bank) {
          throw new NotFoundException(
            `Banque avec l'ID "${dto.bankId}" introuvable.`,
          );
        }
      }
      const headquarter = await this.prisma.subsidiary.findFirst({
        where: { isHeadquarter: true },
      });
      if (!headquarter) {
        throw new NotFoundException(
          'Impossible de trouver la filiale siège pour rattacher ce compte.',
        );
      }
      targetSubsidiaryId = headquarter.id;
    } else {
      // ADMIN/SUPER_ADMIN peuvent créer un compte pour n'importe quelle
      // filiale ; les autres rôles restent forcés sur la leur.
      const isSuperAdmin = (user.roles ?? [user.role]).includes(
        UserRole.SUPER_ADMIN,
      );
      const activeRole = user.activeRole ?? user.role;
      if (isSuperAdmin || activeRole === UserRole.ADMIN) {
        targetSubsidiaryId = dto.subsidiaryId || user.subsidiaryId;
      } else {
        if (dto.subsidiaryId && dto.subsidiaryId !== user.subsidiaryId) {
          throw new ForbiddenException(
            "Vous n'êtes pas autorisé à créer un compte pour une autre filiale.",
          );
        }
        targetSubsidiaryId = user.subsidiaryId;
      }
    }

    const existingAccount = await this.prisma.treasuryAccount.findFirst({
      where: { accountName: dto.accountName, subsidiaryId: targetSubsidiaryId },
    });
    if (existingAccount) {
      throw new ConflictException(
        `Un compte de trésorerie avec le nom "${dto.accountName}" existe déjà dans cette filiale.`,
      );
    }

    if (dto.accountType === AccountType.COMPTE_PREFINANCEMENT) {
      const existing = await this.prisma.treasuryAccount.findFirst({
        where: {
          subsidiaryId: targetSubsidiaryId,
          accountType: AccountType.COMPTE_PREFINANCEMENT,
        },
      });
      if (existing) {
        throw new BadRequestException(
          `Un compte de préfinancement existe déjà pour cette filiale (${existing.accountName}).`,
        );
      }
    }

    // Une seule caisse de dépense par filiale — même règle que gmo.
    if (dto.accountType === AccountType.EXPENSE_BOX) {
      const existingExpenseBox = await this.prisma.treasuryAccount.findFirst({
        where: {
          accountType: AccountType.EXPENSE_BOX,
          subsidiaryId: targetSubsidiaryId,
        },
      });
      if (existingExpenseBox) {
        throw new ConflictException(
          `Une caisse de dépense ("${existingExpenseBox.accountName}") existe déjà pour cette filiale. Une filiale ne peut avoir qu'une seule caisse de dépense.`,
        );
      }
    }

    if (dto.cashierId) {
      await this.validateCashierAssignment(dto.cashierId, dto.accountType);
    }

    const initialBalance = dto.initialBalance || 0;
    const accountId = generateId(ID_PREFIXES.TREASURY);

    return this.prisma.$transaction(async (tx) => {
      await tx.treasuryAccount.create({
        data: {
          id: accountId,
          accountName: dto.accountName,
          // Le solde ne se constitue qu'à travers la transaction d'ouverture
          // ci-dessous (traçabilité) — jamais posé directement en base.
          balance: new Prisma.Decimal(0),
          initialBalance: new Prisma.Decimal(initialBalance),
          currency: dto.currency,
          accountType: dto.accountType,
          subsidiaryId: targetSubsidiaryId,
          cashierId: dto.cashierId,
          accountCode: dto.accountCode,
          accountNumber: dto.accountNumber,
          bankId:
            dto.accountType === AccountType.BANQUE ? dto.bankId : undefined,
        },
      });

      if (initialBalance > 0) {
        // NB : pas d'écriture comptable (accounting outbox) générée ici —
        // contrairement aux autres mouvements de trésorerie, une dotation de
        // solde initial n'a pas de contrepartie évidente dans le plan
        // SYSCOHADA actuel (ni client 411, ni fournisseur 401) : ce serait
        // un compte de capital (101) ou de compte courant associé (455) à
        // choisir explicitement avant de brancher journalization.service.ts
        // dessus. La transaction de trésorerie ci-dessous reste la source de
        // vérité du solde et apparaît dans l'historique/relevé du compte.
        await tx.financialTransaction.create({
          data: {
            id: generateId(ID_PREFIXES.TREASURY),
            transactionDate: new Date(),
            description: 'Solde initial',
            amount: new Prisma.Decimal(initialBalance),
            financialTransactionType: TransactionType.RECETTE,
            treasuryAccountId: accountId,
            destinationAccountId: accountId,
            sourceAccountId: null,
            status: TransactionStatus.VALIDE,
            treasuryType: TreasuryTransactionType.CASH_REFILL,
            balanceAfterDest: new Prisma.Decimal(initialBalance),
            subsidiaryId: targetSubsidiaryId,
            reference: `INIT-${accountId}`,
          },
        });

        await tx.treasuryAccount.update({
          where: { id: accountId },
          data: { balance: new Prisma.Decimal(initialBalance) },
        });
      }

      const created = await tx.treasuryAccount.findUnique({
        where: { id: accountId },
        include: { bank: true },
      });
      return { ...created, balance: Number(created.balance) };
    });
  }

  async findAllAccounts(user: JwtUser, subsidiaryId?: string) {
    const ctx = resolveScopeContext(user);

    const accounts = await this.prisma.treasuryAccount.findMany({
      where: withSubsidiaryScope({}, ctx, subsidiaryId),
      include: {
        bank: true,
        subsidiary: { select: { id: true, subsidiaryName: true } },
      },
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
      include: { bank: true },
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
    const account = await this.findOneAccount(id, user);

    if (dto.cashierId) {
      await this.validateCashierAssignment(
        dto.cashierId,
        account.accountType,
        id,
      );
    }

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
      [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR],
      'Permission denied to validate transactions.',
    );

    if (dto.status !== TransactionStatus.VALIDE) {
      throw new BadRequestException(
        'Seule la transition vers VALIDE est prise en charge.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // SUPER_ADMIN peut valider les transactions de n'importe quelle filiale
      const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;
      const transaction = await tx.financialTransaction.findFirst({
        where: {
          id,
          ...(isSuperAdmin ? {} : { subsidiaryId: user.subsidiaryId }),
        },
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

  private static readonly TRANSFER_TREASURY_TYPES: TreasuryTransactionType[] = [
    TreasuryTransactionType.BANK_WITHDRAWAL,
    TreasuryTransactionType.CASH_REFILL,
  ];

  async createDisbursement(dto: CreateDisbursementDto, user: JwtUser) {
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
      // Pas de filtre subsidiaryId ici : Coffre-fort et Banque sont
      // centralisés au siège (voir createAccount), un SUPER_ADMIN doit
      // pouvoir y accéder même si sa propre filiale n'est pas le siège.
      // L'autorisation par type de compte ci-dessous fait le vrai contrôle.
      const sourceAccount = await tx.treasuryAccount.findFirst({
        where: { id: dto.sourceAccountId },
      });
      if (!sourceAccount) {
        throw new NotFoundException(
          `Treasury account with ID "${dto.sourceAccountId}" not found.`,
        );
      }

      // La caisse (vente) ne fait l'objet d'aucun décaissement direct : son
      // seul mouvement sortant est une remise de caisse (voir CashRemittanceService).
      if (sourceAccount.accountType === AccountType.CASH_REGISTER) {
        throw new BadRequestException(
          'Aucun décaissement direct depuis une caisse — utilisez une remise de caisse.',
        );
      }

      // Autorisation par type de compte source : Coffre-fort et Banque sont
      // gérés exclusivement par le SUPER_ADMIN (checkRole([]) = personne
      // d'autre n'a le rôle requis, seul le bypass SUPER_ADMIN passe) ;
      // Caisse dépense par le Directeur Financier de SA filiale.
      if (
        sourceAccount.accountType === AccountType.SAFE ||
        sourceAccount.accountType === AccountType.BANQUE
      ) {
        checkRole(
          user,
          [],
          'Seul le super-administrateur peut décaisser depuis le coffre-fort ou une banque.',
        );
      } else if (sourceAccount.accountType === AccountType.EXPENSE_BOX) {
        checkRole(
          user,
          [UserRole.FINANCIAL_DIRECTOR],
          'Seul le directeur financier peut décaisser depuis la caisse dépense.',
        );
        assertSubsidiaryAccess(
          sourceAccount.subsidiaryId,
          resolveScopeContext(user),
        );
      } else {
        checkRole(
          user,
          [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR],
          'Permission denied to create a disbursement.',
        );
        assertSubsidiaryAccess(
          sourceAccount.subsidiaryId,
          resolveScopeContext(user),
        );
      }

      if (!isPending && sourceAccount.balance.comparedTo(decimalAmount) < 0) {
        throw new BadRequestException(
          `Solde insuffisant sur "${sourceAccount.accountName}".`,
        );
      }

      let destinationAccount: typeof sourceAccount | null = null;
      if (isTransfer) {
        // Idem : pas de filtre subsidiaryId (ex. coffre siège → caisse
        // dépense d'une filiale précise, choisie par le SUPER_ADMIN).
        destinationAccount = await tx.treasuryAccount.findFirst({
          where: { id: dto.destinationAccountId },
        });
        if (!destinationAccount) {
          throw new NotFoundException(
            `Treasury account with ID "${dto.destinationAccountId}" not found.`,
          );
        }
      }

      // L'écriture appartient à la filiale du compte source (là où l'argent
      // se trouve), pas forcément à celle de l'utilisateur qui agit (un
      // SUPER_ADMIN peut décaisser depuis un compte d'une autre filiale).
      const transactionSubsidiaryId = sourceAccount.subsidiaryId;

      const counterpartyId = await this.resolveCounterparty(
        tx,
        transactionSubsidiaryId,
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
          subsidiaryId: transactionSubsidiaryId,
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
          subsidiaryId: transactionSubsidiaryId,
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

  /**
   * Utilisateurs éligibles comme caissier assigné (CASH_REGISTER/
   * EXPENSE_BOX) — Configuration Trésorerie. Prends en compte le système multi-rôles
   * (userRole, roles, additionalRoles). Exclut les caissiers déjà
   * assignés à un autre compte (sauf si c'est le caissier du compte en cours d'édition).
   * `subsidiaryId` permet à un ADMIN/SUPER_ADMIN de lister les caissiers d'une filiale.
   */
  async findEligibleCashiers(
    user: JwtUser,
    subsidiaryId?: string,
    currentCashierId?: string,
  ) {
    const ctx = resolveScopeContext(user);
    const targetSubsidiaryWhere = subsidiaryId
      ? { subsidiaryId }
      : ctx.hasGlobalScope
        ? {}
        : { subsidiaryId: user.subsidiaryId };

    const cashierRoleCondition = {
      OR: [
        { userRole: UserRole.CAISSIER },
        { roles: { has: UserRole.CAISSIER } },
        { additionalRoles: { has: UserRole.CAISSIER } },
      ],
    };

    const notAssignedCondition = {
      OR: [
        { cashierTreasuryAccounts: { none: {} } },
        ...(currentCashierId ? [{ id: currentCashierId }] : []),
      ],
    };

    const cashiers = await this.prisma.user.findMany({
      where: {
        ...targetSubsidiaryWhere,
        AND: [cashierRoleCondition, notAssignedCondition],
      },
      select: {
        id: true,
        userName: true,
        email: true,
        subsidiary: { select: { id: true, subsidiaryName: true } },
      },
      orderBy: { userName: 'asc' },
    });

    return cashiers.map((c) => ({
      id: c.id,
      userName: c.userName,
      email: c.email,
      subsidiaryName: c.subsidiary?.subsidiaryName,
    }));
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

    // Les 3 relations sont nécessaires côté frontend pour afficher le "tiers"
    // (compte d'émission si encaissement, compte/tiers de réception si
    // décaissement, voir Frontend/utils/transactionDisplay.ts) — un include
    // partiel ici les laissait à `undefined` sur toute vue basée sur cet
    // endpoint générique (Décaissement, Analytics, Caisse dépense,
    // Historique financier), contrairement à findAccountTransactions.
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
