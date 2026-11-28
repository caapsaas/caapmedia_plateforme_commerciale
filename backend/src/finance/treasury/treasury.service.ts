import {
  Injectable,
  Optional,
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
  PaymentStatus,
  DebtStatus,
  ExpenseStatus,
  NotificationType,
  Prisma,
  AccountType,
} from '@prisma/client';
import { CreateTreasuryAccountDto } from './dto/create-treasury-account.dto';
import { endOfDateInput } from 'src/common/utils/date-period.util';
import { CreateFinancialTransactionDto } from './dto/create-financial-transaction.dto';
import { UpdateTreasuryAccountDto } from './dto/update-treasury-account.dto';
import { UpdateTransactionStatusDto } from './dto/update-transaction-status.dto';
import { CreateDisbursementDto } from './dto/create-disbursement.dto';
import { ReverseTransactionDto } from './dto/reverse-transaction.dto';
import { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';
import {
  checkActiveRole,
  checkRole,
} from 'src/common/auth/role/check-role.util';
import {
  getActiveRole,
  isSuperAdmin,
} from 'src/common/auth/role/role-identity';
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
import { withOpeningBalance } from './treasury-opening-balance';
import { SystemAuditService } from 'src/common/audit/system-audit.service';
import { FileUploadService } from 'src/common/utils/file-upload.service';
import { NotificationsService } from 'src/notifications/notifications.service';
@Injectable()
export class TreasuryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountingOutbox: AccountingOutboxService,
    @Optional() private readonly systemAudit?: SystemAuditService,
    @Optional() private readonly fileUploadService?: FileUploadService,
    @Optional() private readonly notificationsService?: NotificationsService,
  ) {}

  // ================================================================= //
  //                       TREASURY ACCOUNTS                           //
  // ================================================================= //

  /** Types de compte pouvant être gérés par un caissier. */
  private static readonly CASHIER_ASSIGNABLE_TYPES: AccountType[] = [
    AccountType.CASH_REGISTER,
    AccountType.EXPENSE_BOX,
  ];

  private async validateCashierAssignment(
    cashierId: string,
    accountType: AccountType,
    subsidiaryId: string,
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
    if (targetUser.subsidiaryId !== subsidiaryId) {
      throw new BadRequestException(
        "Un caissier ne peut être assigné qu'à une caisse de sa filiale.",
      );
    }
  }

  async createAccount(dto: CreateTreasuryAccountDto, user: JwtUser) {
    checkActiveRole(
      user,
      [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR],
      'Vous n’êtes pas autorisé à créer un compte de trésorerie.',
    );

    if (
      dto.accountType === AccountType.BANQUE &&
      !isSuperAdmin(user) &&
      getActiveRole(user) !== UserRole.ADMIN
    ) {
      throw new ForbiddenException(
        'Seuls l’administrateur et le super-admin peuvent créer un compte bancaire.',
      );
    }

    if (
      dto.accountType === AccountType.EXPENSE_BOX &&
      dto.initialBalance !== 0
    ) {
      throw new BadRequestException(
        'La caisse dépense doit être créée avec un solde initial de 0. Alimentez-la ensuite par un transfert depuis le coffre-fort.',
      );
    }
    if (new Prisma.Decimal(dto.initialBalance).decimalPlaces() > 2) {
      throw new BadRequestException(
        'Le solde initial ne peut pas comporter plus de deux chiffres après la virgule.',
      );
    }

    // Tous les comptes sont rattachés à la filiale choisie. ADMIN et
    // SUPER_ADMIN peuvent en choisir une autre ; le Directeur Financier reste
    // limité à sa filiale. Une banque physique reste globale et est référencée
    // par bankId, indépendamment de la filiale du compte bancaire.
    const hasSuperAdminRole = (user.roles ?? [user.role]).includes(
      UserRole.SUPER_ADMIN,
    );
    const activeRole = user.activeRole ?? user.role;
    let targetSubsidiaryId = user.subsidiaryId;
    if (hasSuperAdminRole || activeRole === UserRole.ADMIN) {
      targetSubsidiaryId = dto.subsidiaryId || user.subsidiaryId;
    } else if (dto.subsidiaryId && dto.subsidiaryId !== user.subsidiaryId) {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à créer un compte pour une autre filiale.",
      );
    }

    const targetSubsidiary = await this.prisma.subsidiary.findUnique({
      where: { id: targetSubsidiaryId },
      select: { id: true },
    });
    if (!targetSubsidiary) {
      throw new NotFoundException(
        `Filiale avec l'ID "${targetSubsidiaryId}" introuvable.`,
      );
    }

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
      await this.validateCashierAssignment(
        dto.cashierId,
        dto.accountType,
        targetSubsidiaryId,
      );
    }

    const created = await this.prisma.treasuryAccount.create({
      data: withOpeningBalance(
        {
          id: generateId(ID_PREFIXES.TREASURY),
          accountName: dto.accountName,
          currency: dto.currency,
          accountType: dto.accountType,
          subsidiaryId: targetSubsidiaryId,
          cashierId: dto.cashierId,
          accountCode: dto.accountCode,
          accountNumber: dto.accountNumber,
          bankId:
            dto.accountType === AccountType.BANQUE ? dto.bankId : undefined,
        },
        dto.initialBalance,
        user.id,
      ),
      include: { bank: true },
    });
    return { ...created, balance: Number(created.balance) };
  }

  async findAllAccounts(user: JwtUser, subsidiaryId?: string) {
    const ctx = resolveScopeContext(user);
    const mayViewFullBankNumber =
      isSuperAdmin(user) || getActiveRole(user) === UserRole.ADMIN;

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
      accountNumber:
        !mayViewFullBankNumber && account.accountType === AccountType.BANQUE
          ? this.maskBankAccountNumber(account.accountNumber)
          : account.accountNumber,
    }));
  }

  private maskBankAccountNumber(value: string | null): string | null {
    if (!value) return value;
    return `•••• ${value.slice(-4)}`;
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

    if (
      account.accountType === AccountType.BANQUE &&
      !isSuperAdmin(user) &&
      getActiveRole(user) !== UserRole.ADMIN
    ) {
      account.accountNumber = this.maskBankAccountNumber(account.accountNumber);
    }

    return { ...account, balance: Number(account.balance) };
  }

  async updateAccount(
    id: string,
    dto: UpdateTreasuryAccountDto,
    user: JwtUser,
  ) {
    checkActiveRole(
      user,
      [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      'Permission denied to update treasury accounts.',
    );
    const account = await this.findOneAccount(id, user);

    if (
      account.accountType === AccountType.BANQUE &&
      dto.accountNumber !== undefined
    ) {
      throw new BadRequestException(
        'Le numéro d’un compte bancaire est immuable après sa création. Créez un nouveau compte si les coordonnées changent.',
      );
    }

    if (dto.cashierId) {
      await this.validateCashierAssignment(
        dto.cashierId,
        account.accountType,
        account.subsidiaryId,
      );
    }

    return this.prisma.treasuryAccount.update({ where: { id }, data: dto });
  }

  async deleteAccount(id: string, user: JwtUser) {
    checkActiveRole(
      user,
      [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      'Permission denied to delete treasury accounts.',
    );

    const account = await this.prisma.treasuryAccount.findFirst({
      where: { id },
      include: { _count: { select: { financialTransactions: true } } },
    });

    if (!account) {
      throw new NotFoundException(
        `Treasury account with ID "${id}" not found.`,
      );
    }

    assertSubsidiaryAccess(account.subsidiaryId, resolveScopeContext(user));

    if (account.accountType === AccountType.BANQUE && !isSuperAdmin(user)) {
      throw new ForbiddenException(
        'La suppression d’un compte bancaire est réservée au super-admin.',
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

    checkActiveRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR],
      'Permission denied to create prefinancement accounts.',
    );

    return this.prisma.treasuryAccount.create({
      data: {
        id: generateId(ID_PREFIXES.TREASURY),
        accountName: 'Compte de Préfinancement',
        balance: new Prisma.Decimal(0),
        currency: 'XAF',
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

  private assertIncomeAccount(accountType: AccountType) {
    if (accountType === AccountType.EXPENSE_BOX) {
      throw new BadRequestException(
        'La caisse dépense doit être alimentée par un transfert depuis le coffre-fort.',
      );
    }
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
    checkActiveRole(
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

      if (
        financialTransactionType === TransactionType.DEPENSE &&
        account.accountType === AccountType.BANQUE
      ) {
        throw new BadRequestException(
          'Un décaissement bancaire doit passer par le formulaire de décaissement bancaire.',
        );
      }

      // Toute opération bancaire est mise en attente, même si le client
      // demande explicitement VALIDE. Seul un super-admin différent de
      // l'auteur peut ensuite l'approuver.
      const isPending =
        dto.status === TransactionStatus.EN_ATTENTE ||
        account.accountType === AccountType.BANQUE;

      if (financialTransactionType === TransactionType.RECETTE) {
        this.assertIncomeAccount(account.accountType);
      }

      let balanceBeforeSource: Prisma.Decimal | undefined;
      let balanceAfterSource: Prisma.Decimal | undefined;
      if (!isPending) {
        balanceBeforeSource = account.balance;
        if (financialTransactionType === TransactionType.RECETTE) {
          const updated = await tx.treasuryAccount.update({
            where: { id: treasuryAccountId },
            data: { balance: { increment: decimalAmount } },
          });
          balanceAfterSource = updated.balance;
        } else {
          balanceAfterSource = await this.debitAccount(
            tx,
            account,
            decimalAmount,
          );
        }
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
          proofFilePath: dto.proofFilePath,
          createdByUserId: user.id,
          status: isPending
            ? TransactionStatus.EN_ATTENTE
            : TransactionStatus.VALIDE,
          balanceBeforeSource,
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
    checkActiveRole(
      user,
      [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR],
      'Permission denied to validate transactions.',
    );

    if (
      dto.status !== TransactionStatus.VALIDE &&
      dto.status !== TransactionStatus.ANNULE
    ) {
      throw new BadRequestException(
        'Seule la validation ou l’annulation d’une opération en attente est prise en charge.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // SUPER_ADMIN peut valider les transactions de n'importe quelle filiale
      const transaction = await tx.financialTransaction.findFirst({
        where: {
          id,
          ...(getActiveRole(user) === UserRole.SUPER_ADMIN
            ? {}
            : { subsidiaryId: user.subsidiaryId }),
        },
        include: {
          treasuryAccount: true,
          destinationAccount: true,
          expensePayment: {
            select: { id: true, subsidiaryId: true, description: true },
          },
        },
      });

      if (!transaction) {
        throw new NotFoundException(`Transaction with ID "${id}" not found.`);
      }

      if (transaction.status !== TransactionStatus.EN_ATTENTE) {
        throw new BadRequestException(
          'Seule une transaction EN_ATTENTE peut être validée.',
        );
      }

      const source = transaction.treasuryAccount;
      const isIncome =
        transaction.financialTransactionType === TransactionType.RECETTE;
      const destination = isIncome ? null : transaction.destinationAccount;
      const isBankOperation =
        source.accountType === AccountType.BANQUE ||
        destination?.accountType === AccountType.BANQUE;
      const isOpeningBalanceReceipt =
        transaction.financialTransactionType === TransactionType.RECETTE &&
        transaction.description === 'Solde initial' &&
        transaction.reference === `INIT-${transaction.treasuryAccountId}` &&
        !transaction.destinationAccountId;

      const isSafeOrBankPending =
        isBankOperation || source.accountType === AccountType.SAFE;
      if (
        getActiveRole(user) === UserRole.SUPER_ADMIN &&
        !isSafeOrBankPending &&
        !(source.accountType === AccountType.SAFE && destination)
      ) {
        throw new ForbiddenException(
          'La validation de cette opération est réservée aux gestionnaires de la filiale.',
        );
      }

      if (isIncome) {
        this.assertIncomeAccount(source.accountType);
      } else if (destination) {
        this.assertTransferAccounts(
          source,
          destination,
          transaction.treasuryType,
        );
        if (
          source.accountType === AccountType.SAFE ||
          source.accountType === AccountType.BANQUE
        ) {
          checkActiveRole(
            user,
            [UserRole.SUPER_ADMIN, UserRole.FINANCIAL_DIRECTOR],
            'Seul le super-administrateur ou le directeur financier de la filiale peut valider un transfert depuis le coffre-fort ou une banque.',
          );
        }
      }

      if (isSafeOrBankPending) {
        checkActiveRole(
          user,
          [UserRole.SUPER_ADMIN, UserRole.FINANCIAL_DIRECTOR],
          'Seul le super-administrateur ou le directeur financier de la filiale peut approuver cette opération.',
        );
        if (
          transaction.createdByUserId === user.id &&
          !isOpeningBalanceReceipt
        ) {
          throw new ForbiddenException(
            'L’auteur d’une opération soumise à double approbation ne peut pas l’approuver.',
          );
        }
        if (
          dto.status === TransactionStatus.VALIDE &&
          isBankOperation &&
          !transaction.createdByUserId
        ) {
          throw new ConflictException(
            'Cette ancienne opération n’a pas d’auteur enregistré. Annulez-la puis recréez-la pour respecter la double approbation.',
          );
        }
      }

      if (dto.status === TransactionStatus.ANNULE) {
        if (!isSafeOrBankPending) {
          throw new BadRequestException(
            'Seule une opération bancaire ou de coffre en attente peut être annulée par ce circuit.',
          );
        }
        if (isIncome && isBankOperation && !dto.reason?.trim()) {
          throw new BadRequestException(
            'Un motif est obligatoire pour rejeter ou déclarer impayé un encaissement différé.',
          );
        }
        const cancelled = await tx.financialTransaction.updateMany({
          where: { id, status: TransactionStatus.EN_ATTENTE },
          data: {
            status: TransactionStatus.ANNULE,
            rejectionReason: dto.reason?.trim() || null,
            approvedByUserId: user.id,
            approvedAt: new Date(),
          },
        });
        if (cancelled.count !== 1) {
          throw new ConflictException(
            'Cette opération a déjà été traitée. Actualisez puis réessayez.',
          );
        }

        // Réouverture automatique de la créance Order en cas de chèque/virement impayé
        if (isIncome && transaction.relatedDocumentId) {
          await this.reopenOrderOnBouncedPayment(
            tx,
            transaction.relatedDocumentId,
            transaction.amount,
            dto.reason?.trim() || 'Encaissement différé rejeté / impayé',
            user.id,
          );
        }

        if (transaction.expensePayment) {
          await tx.expenseRecord.update({
            where: { id: transaction.expensePayment.id },
            data: { paymentTransactionId: null },
          });
        }

        await this.systemAudit?.log(
          {
            actorId: user.id,
            actorEmail: user.email,
            actorRole: getActiveRole(user),
            subsidiaryId: transaction.subsidiaryId,
            action:
              isIncome && transaction.relatedDocumentId
                ? 'DEFERRED_PAYMENT_BOUNCED'
                : 'TREASURY_TRANSACTION_CANCELLED',
            entityType: 'FinancialTransaction',
            entityId: id,
            summary: `Transaction ${id} annulée par ${user.email}${dto.reason ? ` (${dto.reason})` : ''}`,
            metadata: {
              amount: Number(transaction.amount),
              sourceAccountId: source.id,
              destinationAccountId: destination?.id ?? null,
              reason: dto.reason?.trim() || null,
            },
          },
          tx,
        );
        return tx.financialTransaction.findUniqueOrThrow({ where: { id } });
      }

      const claimed = await tx.financialTransaction.updateMany({
        where: { id, status: TransactionStatus.EN_ATTENTE },
        data: {
          status: TransactionStatus.VALIDE,
          approvedByUserId: user.id,
          approvedAt: new Date(),
        },
      });
      if (claimed.count !== 1) {
        throw new BadRequestException(
          'Seule une transaction EN_ATTENTE peut être validée.',
        );
      }

      const rawBankFees = Number(dto.bankFees ?? 0);
      if (
        isIncome &&
        rawBankFees > 0 &&
        rawBankFees >= Number(transaction.amount)
      ) {
        throw new BadRequestException(
          'Les frais bancaires doivent être strictement inférieurs au montant encaissé.',
        );
      }
      const feesDecimal =
        isIncome && rawBankFees > 0 ? new Prisma.Decimal(rawBankFees) : null;
      const netCreditAmount = feesDecimal
        ? transaction.amount.sub(feesDecimal)
        : transaction.amount;

      const balanceBeforeSource = source.balance;
      const balanceBeforeDest = destination?.balance;

      const balanceAfterSource = isIncome
        ? (
            await tx.treasuryAccount.update({
              where: { id: source.id },
              data: { balance: { increment: netCreditAmount } },
            })
          ).balance
        : await this.debitAccount(tx, source, transaction.amount);
      const updatedDestination =
        destination &&
        (await tx.treasuryAccount.update({
          where: { id: destination.id },
          data: { balance: { increment: transaction.amount } },
        }));

      // Si paiement différé de dette fournisseur via Banque/Coffre, solder la dette ici
      if (!isIncome && transaction.supplierDebtId) {
        await this.settleSupplierDebtOnApproval(
          tx,
          transaction.supplierDebtId,
          transaction.amount,
          source.accountName,
        );
      }

      if (!isIncome && transaction.expensePayment) {
        await tx.expenseRecord.update({
          where: { id: transaction.expensePayment.id },
          data: { status: ExpenseStatus.PAID },
        });
      }

      const updatedTransaction = await tx.financialTransaction.update({
        where: { id },
        data: {
          balanceBeforeSource,
          balanceAfterSource,
          balanceBeforeDest,
          balanceAfterDest: updatedDestination?.balance,
          ...(feesDecimal
            ? { grossAmount: transaction.amount, feesAmount: feesDecimal }
            : {}),
        },
      });

      const outboxEventType = destination
        ? 'TREASURY_TRANSFER'
        : isIncome
          ? 'TREASURY_INCOME'
          : transaction.supplierDebtId
            ? 'SUPPLIER_DEBT_PAYMENT'
            : transaction.expensePayment
              ? 'EXPENSE_RECORD_PAYMENT'
              : 'TREASURY_EXPENSE';

      await this.accountingOutbox.enqueue(tx, {
        eventType: outboxEventType,
        subsidiaryId: transaction.subsidiaryId,
        payload: {
          userId: user.id,
          operationDate: transaction.transactionDate.toISOString(),
          amount: Number(isIncome ? netCreditAmount : transaction.amount),
          ...(feesDecimal ? { feesAmount: Number(feesDecimal) } : {}),
          description: transaction.description,
          sourceId: transaction.id,
          accountType: source.accountType,
          destinationAccountType: destination?.accountType,
        },
      });

      await this.systemAudit?.log(
        {
          actorId: user.id,
          actorEmail: user.email,
          actorRole: getActiveRole(user),
          subsidiaryId: transaction.subsidiaryId,
          action: 'TREASURY_TRANSACTION_VALIDATED',
          entityType: 'FinancialTransaction',
          entityId: id,
          summary: `Transaction ${id} validée par ${user.email}`,
          metadata: {
            amount: Number(transaction.amount),
            sourceAccountId: source.id,
            destinationAccountId: destination?.id ?? null,
          },
        },
        tx,
      );

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

  private assertTransferAccounts(
    source: { id: string; accountType: AccountType; currency: string },
    destination: { id: string; accountType: AccountType; currency: string },
    treasuryType: TreasuryTransactionType | null,
  ) {
    if (source.id === destination.id) {
      throw new BadRequestException(
        'Les comptes source et destination doivent être différents.',
      );
    }
    if (
      treasuryType === TreasuryTransactionType.CASH_REFILL ||
      destination.accountType === AccountType.EXPENSE_BOX
    ) {
      if (
        treasuryType !== TreasuryTransactionType.CASH_REFILL ||
        source.accountType !== AccountType.SAFE ||
        destination.accountType !== AccountType.EXPENSE_BOX
      ) {
        throw new BadRequestException(
          'La caisse dépense doit être alimentée par un transfert depuis le coffre-fort.',
        );
      }
      if (source.currency !== destination.currency) {
        throw new BadRequestException(
          'Le coffre-fort et la caisse dépense doivent avoir la même devise.',
        );
      }
    }
  }

  private async debitAccount(
    tx: Prisma.TransactionClient,
    account: { id: string; accountName: string },
    amount: Prisma.Decimal,
  ) {
    const debit = await tx.treasuryAccount.updateMany({
      where: { id: account.id, balance: { gte: amount } },
      data: { balance: { decrement: amount } },
    });
    if (debit.count !== 1) {
      throw new BadRequestException(
        `Solde insuffisant sur "${account.accountName}".`,
      );
    }
    const updated = await tx.treasuryAccount.findUniqueOrThrow({
      where: { id: account.id },
      select: { balance: true },
    });
    return updated.balance;
  }

  async createDisbursement(dto: CreateDisbursementDto, user: JwtUser) {
    if (dto.treasuryType === TreasuryTransactionType.SUPPLIER_PAYMENT) {
      throw new BadRequestException(
        'Un paiement fournisseur doit être rattaché à une dette fournisseur existante.',
      );
    }

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
    if (decimalAmount.decimalPlaces() > 2) {
      throw new BadRequestException(
        'Le montant du décaissement doit comporter au plus deux décimales.',
      );
    }
    return this.prisma.$transaction(async (tx) => {
      // Recherche globale nécessaire aux virements entre filiales et aux
      // comptes centraux. L'autorisation par type de compte fait le contrôle.
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
      // réservés au super-admin actif ;
      // Caisse dépense par le Directeur Financier de SA filiale.
      if (
        sourceAccount.accountType === AccountType.SAFE ||
        sourceAccount.accountType === AccountType.BANQUE
      ) {
        checkActiveRole(
          user,
          [UserRole.SUPER_ADMIN],
          'Seul le super-administrateur peut décaisser depuis le coffre-fort ou une banque.',
        );
      } else if (sourceAccount.accountType === AccountType.EXPENSE_BOX) {
        checkActiveRole(
          user,
          [UserRole.FINANCIAL_DIRECTOR],
          'Seul le directeur financier peut décaisser depuis la caisse dépense.',
        );
        assertSubsidiaryAccess(
          sourceAccount.subsidiaryId,
          resolveScopeContext(user),
        );
      } else {
        checkActiveRole(
          user,
          [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR],
          'Permission denied to create a disbursement.',
        );
        assertSubsidiaryAccess(
          sourceAccount.subsidiaryId,
          resolveScopeContext(user),
        );
      }

      let destinationAccount: typeof sourceAccount | null = null;
      if (isTransfer) {
        // Idem : pas de filtre subsidiaryId pour autoriser les transferts
        // inter-filiales choisis explicitement par le SUPER_ADMIN.
        destinationAccount = await tx.treasuryAccount.findFirst({
          where: { id: dto.destinationAccountId },
        });
        if (!destinationAccount) {
          throw new NotFoundException(
            `Treasury account with ID "${dto.destinationAccountId}" not found.`,
          );
        }
        this.assertTransferAccounts(
          sourceAccount,
          destinationAccount,
          dto.treasuryType,
        );
      }

      // Seuils configurables filiale (Imprest + Plafond unitaire + Maker-Checker Coffre)
      const subConfig = await tx.subsidiary.findUnique({
        where: { id: sourceAccount.subsidiaryId },
        select: {
          expenseBoxUnitLimit: true,
          expenseBoxImprestCeiling: true,
          safeMakerCheckerThreshold: true,
        },
      });

      if (
        sourceAccount.accountType === AccountType.EXPENSE_BOX &&
        subConfig?.expenseBoxUnitLimit != null &&
        decimalAmount.greaterThan(subConfig.expenseBoxUnitLimit)
      ) {
        throw new BadRequestException(
          `Montant supérieur au plafond unitaire de la caisse dépense (${Number(subConfig.expenseBoxUnitLimit)} FCFA).`,
        );
      }

      if (
        destinationAccount?.accountType === AccountType.EXPENSE_BOX &&
        subConfig?.expenseBoxImprestCeiling != null &&
        destinationAccount.balance
          .add(decimalAmount)
          .greaterThan(subConfig.expenseBoxImprestCeiling)
      ) {
        throw new BadRequestException(
          `L'alimentation dépasse le plafond d'avance Imprest de la caisse dépense (${Number(subConfig.expenseBoxImprestCeiling)} FCFA).`,
        );
      }

      // Toute opération impliquant un compte bancaire OU dépassant le seuil coffre-fort
      // attend une approbation distincte.
      const isBankOperation =
        sourceAccount.accountType === AccountType.BANQUE ||
        destinationAccount?.accountType === AccountType.BANQUE;
      const exceedsSafeThreshold =
        sourceAccount.accountType === AccountType.SAFE &&
        subConfig?.safeMakerCheckerThreshold != null &&
        decimalAmount.greaterThanOrEqualTo(subConfig.safeMakerCheckerThreshold);
      const isPending =
        dto.status === TransactionStatus.EN_ATTENTE ||
        isBankOperation ||
        exceedsSafeThreshold;

      // L'écriture appartient à la filiale du compte source (là où l'argent
      // se trouve), pas forcément à celle de l'utilisateur qui agit (un
      // SUPER_ADMIN peut décaisser depuis un compte d'une autre filiale).
      const transactionSubsidiaryId = sourceAccount.subsidiaryId;

      const counterpartyId = await this.resolveCounterparty(
        tx,
        transactionSubsidiaryId,
        dto,
      );

      let balanceBeforeSource: Prisma.Decimal | undefined;
      let balanceAfterSource: Prisma.Decimal | undefined;
      let balanceBeforeDest: Prisma.Decimal | undefined;
      let balanceAfterDest: Prisma.Decimal | undefined;
      if (!isPending) {
        balanceBeforeSource = sourceAccount.balance;
        balanceAfterSource = await this.debitAccount(
          tx,
          sourceAccount,
          decimalAmount,
        );

        if (destinationAccount) {
          balanceBeforeDest = destinationAccount.balance;
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
          proofFilePath: dto.proofFilePath,
          counterpartyId,
          createdByUserId: user.id,
          subsidiaryId: transactionSubsidiaryId,
          transactionDate: new Date(dto.transactionDate),
          status: isPending
            ? TransactionStatus.EN_ATTENTE
            : TransactionStatus.VALIDE,
          balanceBeforeSource,
          balanceAfterSource,
          balanceBeforeDest,
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
   * EXPENSE_BOX) — Configuration Trésorerie. Prend en compte le système multi-rôles
   * (userRole, roles, additionalRoles). Un caissier peut être affecté à plusieurs
   * comptes de sa filiale.
   * `subsidiaryId` permet à un ADMIN/SUPER_ADMIN de lister les caissiers d'une filiale.
   */
  async findEligibleCashiers(user: JwtUser, subsidiaryId?: string) {
    const ctx = resolveScopeContext(user);
    const targetSubsidiaryWhere = withSubsidiaryScope({}, ctx, subsidiaryId);

    const cashierRoleCondition = {
      OR: [
        { userRole: UserRole.CAISSIER },
        { roles: { has: UserRole.CAISSIER } },
        { additionalRoles: { has: UserRole.CAISSIER } },
      ],
    };

    const cashiers = await this.prisma.user.findMany({
      where: {
        ...targetSubsidiaryWhere,
        AND: [cashierRoleCondition],
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
    const result = await paginate(
      this.prisma.financialTransaction,
      {
        where,
        orderBy: { transactionDate: 'desc' },
        include: {
          treasuryAccount: { select: { accountName: true, accountType: true } },
          destinationAccount: {
            select: { accountName: true, accountType: true },
          },
          counterparty: { select: { name: true } },
        },
      },
      paginationQuery,
    );
    return {
      ...result,
      data: await this.enrichTransactionsTraceability(result.data),
    };
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
        ...(endDate ? { lte: endOfDateInput(endDate) } : {}),
      };
    }

    const result = await paginate(
      this.prisma.financialTransaction,
      {
        where,
        orderBy: { transactionDate: 'desc' },
        include: {
          treasuryAccount: { select: { accountName: true, accountType: true } },
          destinationAccount: {
            select: { accountName: true, accountType: true },
          },
          counterparty: { select: { name: true } },
        },
      },
      paginationQuery,
    );
    return {
      ...result,
      data: await this.enrichTransactionsTraceability(result.data),
    };
  }

  private async enrichTransactionsTraceability<
    T extends {
      id: string;
      createdByUserId?: string | null;
      approvedByUserId?: string | null;
      reversedByUserId?: string | null;
    },
  >(transactions: T[]) {
    if (!transactions.length) return transactions;
    const userIds = Array.from(
      new Set(
        transactions
          .flatMap((t) => [
            t.createdByUserId,
            t.approvedByUserId,
            t.reversedByUserId,
          ])
          .filter((id): id is string => !!id),
      ),
    );
    const txIds = transactions.map((t) => t.id);

    const [users, journalEntries] = await Promise.all([
      userIds.length
        ? this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, userName: true, email: true },
          })
        : Promise.resolve([]),
      this.prisma.journalEntry.findMany({
        where: { sourceId: { in: txIds } },
        select: {
          id: true,
          sourceId: true,
          entryNumber: true,
          sequentialNumber: true,
        },
      }),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));
    const journalMap = new Map(
      journalEntries.filter((j) => !!j.sourceId).map((j) => [j.sourceId, j]),
    );

    return transactions.map((t) => {
      const journal = journalMap.get(t.id);
      return {
        ...t,
        createdByUser: t.createdByUserId
          ? (userMap.get(t.createdByUserId) ?? null)
          : null,
        approvedByUser: t.approvedByUserId
          ? (userMap.get(t.approvedByUserId) ?? null)
          : null,
        reversedByUser: t.reversedByUserId
          ? (userMap.get(t.reversedByUserId) ?? null)
          : null,
        journalEntryId: journal?.id ?? null,
        journalEntryReference:
          journal?.sequentialNumber || journal?.entryNumber || null,
      };
    });
  }

  private async reopenOrderOnBouncedPayment(
    tx: Prisma.TransactionClient,
    orderId: string,
    bouncedAmount: Prisma.Decimal,
    reason: string,
    actorId: string,
  ) {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) return;

    const currentPaid = new Prisma.Decimal(order.amountPaid);
    const nextPaid = currentPaid.greaterThan(bouncedAmount)
      ? currentPaid.sub(bouncedAmount)
      : new Prisma.Decimal(0);
    const nextStatus = nextPaid.isZero()
      ? PaymentStatus.UNPAID
      : nextPaid.greaterThanOrEqualTo(order.totalAmount)
        ? PaymentStatus.PAID
        : PaymentStatus.PARTIALLY_PAID;

    await tx.order.update({
      where: { id: order.id },
      data: { amountPaid: nextPaid, paymentStatus: nextStatus },
    });

    if (
      order.paymentStatus === PaymentStatus.PAID &&
      nextStatus !== PaymentStatus.PAID
    ) {
      await tx.sale.deleteMany({ where: { orderId: order.id } });
    }

    if (this.notificationsService) {
      const roles = [
        UserRole.COMMERCIAL,
        UserRole.CAISSIER,
        UserRole.FINANCIAL_DIRECTOR,
        UserRole.ADMIN,
        UserRole.SUPER_ADMIN,
      ];
      await Promise.all(
        roles.map((role) =>
          this.notificationsService.notifyUsersByRole(
            order.subsidiaryId,
            role,
            {
              title: `Incident de paiement sur commande ${order.id}`,
              message: `Encaissement rejeté/impayé (${Number(bouncedAmount)} FCFA) — Motif : ${reason}. Créance réouverte par ${actorId}.`,
              type: NotificationType.PAYMENT_RECEIVED,
              data: {
                orderId: order.id,
                reason,
                amount: Number(bouncedAmount),
              },
            },
          ),
        ),
      );
    }
  }

  private async settleSupplierDebtOnApproval(
    tx: Prisma.TransactionClient,
    debtId: string,
    paymentAmount: Prisma.Decimal,
    accountName: string,
  ) {
    const debt = await tx.supplierDebt.findUnique({
      where: { id: debtId },
      include: { purchaseOrder: true },
    });
    if (!debt || debt.status === DebtStatus.PAYER) return;

    const remainingDebt = debt.amount.greaterThan(paymentAmount)
      ? debt.amount.sub(paymentAmount)
      : new Prisma.Decimal(0);
    const newDebtStatus = remainingDebt.isZero()
      ? DebtStatus.PAYER
      : DebtStatus.PARTIELLEMENT_PAYE;

    await tx.supplierDebt.update({
      where: { id: debt.id },
      data: { amount: remainingDebt, status: newDebtStatus },
    });

    const po = debt.purchaseOrder;
    const newAmountPaid = po.amountPaid.add(paymentAmount);
    const newPaymentStatus = newAmountPaid.gte(po.totalAmount)
      ? PaymentStatus.PAID
      : PaymentStatus.PARTIALLY_PAID;
    await tx.purchaseOrder.update({
      where: { id: po.id },
      data: { amountPaid: newAmountPaid, paymentStatus: newPaymentStatus },
    });
    await tx.purchaseOrderHistory.create({
      data: {
        purchaseOrderId: po.id,
        eventName: `Paiement de ${Number(paymentAmount)} validé (${accountName})`,
      },
    });
  }

  async deleteTransaction(id: string, user: JwtUser) {
    checkActiveRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR],
      'Permission denied to delete transactions.',
    );

    const transaction = await this.prisma.financialTransaction.findFirst({
      where: { id, subsidiaryId: user.subsidiaryId },
      include: {
        treasuryAccount: true,
        destinationAccount: true,
        needRequestPayment: { select: { id: true } },
        expensePayment: { select: { id: true } },
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID "${id}" not found.`);
    }

    if (
      transaction.status === TransactionStatus.VALIDE ||
      transaction.status === TransactionStatus.REVERSED
    ) {
      throw new BadRequestException(
        'Une transaction validée ne peut jamais être supprimée. Utilisez la contre-passation motivée.',
      );
    }
    if (transaction.needRequestPayment) {
      throw new BadRequestException(
        'Le règlement lié à une expression de besoin ne peut pas être supprimé.',
      );
    }
    if (transaction.expensePayment) {
      throw new BadRequestException(
        'Le règlement lié à une charge ne peut pas être supprimé.',
      );
    }
    return this.prisma.$transaction(async (tx) => {
      const deleted = await tx.financialTransaction
        .delete({ where: { id, status: transaction.status } })
        .catch((error: unknown) => {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2025'
          ) {
            throw new ConflictException(
              'La transaction a été modifiée ou supprimée entre-temps.',
            );
          }
          throw error;
        });
      return deleted;
    });
  }

  async reverseTransaction(
    id: string,
    dto: ReverseTransactionDto,
    user: JwtUser,
  ) {
    checkActiveRole(
      user,
      [UserRole.SUPER_ADMIN, UserRole.FINANCIAL_DIRECTOR],
      'Seul le super-administrateur ou le directeur financier peut contre-passer une transaction.',
    );

    const reason = dto.reason?.trim();
    if (!reason) {
      throw new BadRequestException(
        'Un motif est obligatoire pour contre-passer une transaction.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const original = await tx.financialTransaction.findFirst({
        where: {
          id,
          ...(isSuperAdmin(user) ? {} : { subsidiaryId: user.subsidiaryId }),
        },
        include: {
          treasuryAccount: true,
          destinationAccount: true,
          expensePayment: {
            select: { id: true, subsidiaryId: true, description: true },
          },
        },
      });

      if (!original) {
        throw new NotFoundException(`Transaction with ID "${id}" not found.`);
      }
      if (
        original.status !== TransactionStatus.VALIDE ||
        original.isReversed ||
        original.reversedTransactionId
      ) {
        throw new BadRequestException(
          'Seule une transaction validée et non encore contre-passée peut être contre-passée.',
        );
      }

      const source = original.treasuryAccount;
      const dest = original.destinationAccount;
      const effectiveSourceAmount =
        original.financialTransactionType === TransactionType.RECETTE &&
        original.feesAmount
          ? original.amount.sub(original.feesAmount)
          : original.amount;

      const balanceBeforeSource = source.balance;
      const balanceAfterSource =
        original.financialTransactionType === TransactionType.RECETTE
          ? await this.debitAccount(tx, source, effectiveSourceAmount)
          : (
              await tx.treasuryAccount.update({
                where: { id: source.id },
                data: { balance: { increment: effectiveSourceAmount } },
              })
            ).balance;

      let balanceBeforeDest: Prisma.Decimal | undefined;
      let balanceAfterDest: Prisma.Decimal | undefined;
      if (dest) {
        balanceBeforeDest = dest.balance;
        balanceAfterDest = await this.debitAccount(tx, dest, original.amount);
      }

      await tx.financialTransaction.update({
        where: { id: original.id },
        data: {
          status: TransactionStatus.REVERSED,
          isReversed: true,
          reversalReason: reason,
          reversedByUserId: user.id,
          reversedAt: new Date(),
        },
      });

      const mirrorType =
        original.financialTransactionType === TransactionType.RECETTE
          ? TransactionType.DEPENSE
          : TransactionType.RECETTE;

      const reversalTx = await tx.financialTransaction.create({
        data: {
          id: generateId(ID_PREFIXES.TREASURY),
          description: `Contre-passation (${original.id}) : ${reason}`,
          amount: effectiveSourceAmount,
          financialTransactionType: mirrorType,
          treasuryAccountId: source.id,
          sourceAccountId: source.id,
          destinationAccountId: dest?.id,
          treasuryType: original.treasuryType,
          reference: `REV-${original.reference || original.id}`,
          relatedDocumentId: original.relatedDocumentId,
          subsidiaryId: original.subsidiaryId,
          transactionDate: new Date(),
          status: TransactionStatus.VALIDE,
          createdByUserId: user.id,
          approvedByUserId: user.id,
          approvedAt: new Date(),
          reversedTransactionId: original.id,
          reversalReason: reason,
          balanceBeforeSource,
          balanceAfterSource,
          balanceBeforeDest,
          balanceAfterDest,
        },
      });

      await this.accountingOutbox.enqueue(tx, {
        eventType: 'TRANSACTION_REVERSAL',
        subsidiaryId: original.subsidiaryId,
        payload: {
          userId: user.id,
          operationDate: new Date().toISOString(),
          amount: Number(effectiveSourceAmount),
          description: reversalTx.description,
          sourceId: reversalTx.id,
          reversedSourceId: original.id,
        },
      });

      await this.systemAudit?.log(
        {
          actorId: user.id,
          actorEmail: user.email,
          actorRole: getActiveRole(user),
          subsidiaryId: original.subsidiaryId,
          action: 'TREASURY_TRANSACTION_REVERSED',
          entityType: 'FinancialTransaction',
          entityId: original.id,
          summary: `Transaction ${original.id} contre-passée par ${user.email} (${reason})`,
          metadata: {
            reversalTransactionId: reversalTx.id,
            amount: Number(effectiveSourceAmount),
            reason,
          },
        },
        tx,
      );

      return reversalTx;
    });
  }

  async attachProof(id: string, file: Express.Multer.File, user: JwtUser) {
    checkActiveRole(
      user,
      [
        UserRole.SUPER_ADMIN,
        UserRole.ADMIN,
        UserRole.FINANCIAL_DIRECTOR,
        UserRole.CAISSIER,
      ],
      'Permission denied to upload transaction proof.',
    );

    if (!file || !file.buffer) {
      throw new BadRequestException('Aucun fichier justificatif fourni.');
    }
    if (!this.fileUploadService) {
      throw new BadRequestException('Service de stockage indisponible.');
    }

    const transaction = await this.prisma.financialTransaction.findFirst({
      where: {
        id,
        ...(isSuperAdmin(user) ? {} : { subsidiaryId: user.subsidiaryId }),
      },
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID "${id}" not found.`);
    }

    const { url } = await this.fileUploadService.uploadFile(
      file.buffer,
      file.originalname,
      {
        privateSubsidiaryId: transaction.subsidiaryId,
        maxSizeMb: 10,
      },
    );

    return this.prisma.financialTransaction.update({
      where: { id },
      data: { proofFilePath: url },
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

    if (account.accountType === AccountType.BANQUE) {
      throw new BadRequestException(
        'Une dépense ne peut pas débiter directement un compte bancaire. Utilisez une opération bancaire soumise à approbation.',
      );
    }

    if (account.balance.comparedTo(decimalAmount) < 0) {
      throw new BadRequestException(
        `Solde insuffisant sur "${account.accountName}". Solde: ${account.balance}, Montant: ${decimalAmount}.`,
      );
    }

    const balanceBeforeSource = account.balance;
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
        balanceBeforeSource,
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
