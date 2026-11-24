import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { isISO8601 } from 'class-validator';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import {
  UserRole,
  AccountType,
  TransactionType,
  TransactionStatus,
  CashRemittanceStatus,
  OrderStatus,
  Prisma,
} from '@prisma/client';
import { CreateCashRemittanceDto } from './dto/create-cash-remittance.dto';
import { ReceiveCashRemittanceDto } from './dto/receive-cash-remittance.dto';
import { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';
import { checkActiveRole } from 'src/common/auth/role/check-role.util';
import {
  resolveScopeContext,
  assertSubsidiaryAccess,
} from 'src/common/utils/subsidiary-scope';
import { AccountingOutboxService } from 'src/accounting/outbox/accounting-outbox.service';
import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';

const REMITTANCE_INCLUDE = {
  createdByUser: { select: { userName: true } },
  receivedByUser: { select: { userName: true } },
  sourceCashRegister: true,
  destinationSafe: true,
  orders: { include: { order: { select: { id: true, customerName: true } } } },
  receipts: {
    include: {
      financialTransaction: {
        select: { id: true, relatedDocumentId: true, amount: true },
      },
    },
  },
} satisfies Prisma.CashRemittanceInclude;

/**
 * Remise de caisse : la caisse (CASH_REGISTER) ne fait l'objet d'aucun
 * décaissement direct (voir TreasuryService.createDisbursement), seulement
 * de remises vers le coffre-fort (SAFE) de sa filiale. Le Directeur Financier
 * de cette filiale réceptionne et confirme le comptage réel.
 */
@Injectable()
export class CashRemittanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountingOutbox: AccountingOutboxService,
  ) {}

  private sourceAccountScope(user: JwtUser) {
    if (
      (user.activeRole ?? user.role) !== UserRole.CAISSIER ||
      !user.id ||
      !user.subsidiaryId
    ) {
      throw new ForbiddenException(
        'Un caissier rattaché à une filiale est requis.',
      );
    }

    return {
      cashierId: user.id,
      subsidiaryId: user.subsidiaryId,
      accountType: AccountType.CASH_REGISTER,
    };
  }

  private serializeRemittance<
    T extends {
      declaredAmount: Prisma.Decimal;
      receivedAmount: Prisma.Decimal | null;
      discrepancy: Prisma.Decimal | null;
      receipts?: {
        financialTransaction: { amount: Prisma.Decimal };
      }[];
    },
  >(remittance: T) {
    // Prisma Decimal devient une chaîne lors de la sérialisation JSON. Les
    // écrans financiers attendent des nombres (Number.isFinite sinon affiche 0).
    return {
      ...remittance,
      declaredAmount: Number(remittance.declaredAmount),
      receivedAmount:
        remittance.receivedAmount == null
          ? null
          : Number(remittance.receivedAmount),
      discrepancy:
        remittance.discrepancy == null ? null : Number(remittance.discrepancy),
      ...(remittance.receipts
        ? {
            receipts: remittance.receipts.map((receipt) => ({
              ...receipt,
              financialTransaction: {
                ...receipt.financialTransaction,
                amount: Number(receipt.financialTransaction.amount),
              },
            })),
          }
        : {}),
    };
  }

  private doualaDayRange(now = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Douala',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);
    const part = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((item) => item.type === type)?.value);
    const start =
      Date.UTC(part('year'), part('month') - 1, part('day')) - 60 * 60 * 1000;
    return { start: new Date(start), end: new Date(start + 86400000) };
  }

  private validateRemittanceDate(date: string) {
    if (!isISO8601(date, { strict: true })) {
      throw new BadRequestException(
        'La journée des encaissements est invalide.',
      );
    }

    const remittanceDate = new Date(date);
    if (!Number.isFinite(remittanceDate.getTime())) {
      throw new BadRequestException(
        'La journée des encaissements est invalide.',
      );
    }
    if (
      this.doualaDayRange(remittanceDate).start > this.doualaDayRange().start
    ) {
      throw new BadRequestException(
        'La journée des encaissements ne peut pas être future.',
      );
    }
    return remittanceDate;
  }

  private async pendingAmounts(
    client: Prisma.TransactionClient,
    accountIds: string[],
    subsidiaryId: string,
  ) {
    const amounts = await client.cashRemittance.groupBy({
      by: ['sourceCashRegisterId'],
      where: {
        sourceCashRegisterId: { in: accountIds },
        subsidiaryId,
        status: CashRemittanceStatus.SUBMITTED,
      },
      _sum: { declaredAmount: true },
    });
    return new Map(
      amounts.map((amount) => [
        amount.sourceCashRegisterId,
        amount._sum.declaredAmount ?? new Prisma.Decimal(0),
      ]),
    );
  }

  async findSourceAccounts(user: JwtUser) {
    const scope = this.sourceAccountScope(user);
    const accounts = await this.prisma.treasuryAccount.findMany({
      where: scope,
      select: { id: true, accountName: true, balance: true },
      orderBy: { accountName: 'asc' },
    });
    if (!accounts.length) return [];

    const pending = await this.pendingAmounts(
      this.prisma,
      accounts.map((account) => account.id),
      scope.subsidiaryId,
    );
    return accounts.map((account) => ({
      ...account,
      balance: Number(account.balance),
      availableBalance: Math.max(
        0,
        Number(account.balance.sub(pending.get(account.id) ?? 0)),
      ),
    }));
  }

  private async availableReceipts(
    client: Prisma.TransactionClient,
    subsidiaryId: string,
    accountIds: string[],
    receiptIds?: string[],
  ) {
    const receipts = await client.financialTransaction.findMany({
      where: {
        ...(receiptIds ? { id: { in: receiptIds } } : {}),
        subsidiaryId,
        treasuryAccountId: { in: accountIds },
        financialTransactionType: TransactionType.RECETTE,
        status: TransactionStatus.VALIDE,
        relatedDocumentId: { not: null },
        cashRemittanceReceipts: { none: {} },
      },
      select: {
        id: true,
        treasuryAccountId: true,
        relatedDocumentId: true,
        transactionDate: true,
        amount: true,
      },
      orderBy: { transactionDate: 'desc' },
    });
    if (!receipts.length) return [];
    const orders = await client.order.findMany({
      where: {
        id: {
          in: receipts.flatMap((receipt) => receipt.relatedDocumentId ?? []),
        },
        subsidiaryId,
        status: { not: OrderStatus.CANCELLED },
        cashRemittanceOrders: { none: {} },
      },
      select: { id: true },
    });
    const eligibleOrders = new Set(orders.map((order) => order.id));
    return receipts.filter(
      (receipt) =>
        receipt.relatedDocumentId &&
        eligibleOrders.has(receipt.relatedDocumentId),
    );
  }

  async findAvailableReceipts(user: JwtUser) {
    const scope = this.sourceAccountScope(user);
    const accounts = await this.prisma.treasuryAccount.findMany({
      where: scope,
      select: { id: true },
    });
    if (!accounts.length) return [];
    const receipts = await this.availableReceipts(
      this.prisma,
      scope.subsidiaryId,
      accounts.map((account) => account.id),
    );
    return receipts.map((receipt) => ({
      ...receipt,
      amount: Number(receipt.amount),
    }));
  }

  async create(dto: CreateCashRemittanceDto, user: JwtUser) {
    const sourceAccountScope = this.sourceAccountScope(user);
    const remittanceDate = this.validateRemittanceDate(dto.remittanceDate);
    if (!Number.isFinite(dto.declaredAmount) || dto.declaredAmount <= 0) {
      throw new BadRequestException('Le montant à remettre doit être positif.');
    }
    const declaredAmount = new Prisma.Decimal(dto.declaredAmount);
    if (declaredAmount.decimalPlaces() > 2) {
      throw new BadRequestException(
        'Le montant à remettre doit avoir au plus deux décimales.',
      );
    }

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const accounts = await tx.treasuryAccount.findMany({
            where: {
              id: dto.sourceCashRegisterId,
              ...sourceAccountScope,
            },
            take: 2,
          });
          if (accounts.length > 1) {
            throw new BadRequestException('Veuillez choisir la caisse source.');
          }
          const [sourceAccount] = accounts;
          if (!sourceAccount) {
            throw new NotFoundException(
              "Aucune caisse n'est associée à votre compte. Contactez l'administrateur.",
            );
          }

          const pending = await this.pendingAmounts(
            tx,
            [sourceAccount.id],
            sourceAccount.subsidiaryId,
          );
          const availableBalance = sourceAccount.balance.sub(
            pending.get(sourceAccount.id) ?? 0,
          );
          if (declaredAmount.gt(availableBalance)) {
            throw new BadRequestException(
              'Le montant déclaré dépasse le solde disponible après déduction des remises en attente.',
            );
          }

          const receiptIds = dto.receiptIds ?? [];
          if (receiptIds.length) {
            const receipts = await this.availableReceipts(
              tx,
              sourceAccount.subsidiaryId,
              [sourceAccount.id],
              receiptIds,
            );
            const linkedAmount = receipts.reduce(
              (total, receipt) => total.plus(receipt.amount),
              new Prisma.Decimal(0),
            );
            if (
              receipts.length !== receiptIds.length ||
              linkedAmount.gt(declaredAmount)
            ) {
              throw new BadRequestException(
                'Les encaissements sélectionnés doivent être disponibles et leur total ne peut pas dépasser le montant déclaré.',
              );
            }
          }

          const destinationSafe = await tx.treasuryAccount.findFirst({
            where: {
              subsidiaryId: sourceAccount.subsidiaryId,
              accountType: AccountType.SAFE,
            },
          });
          if (!destinationSafe) {
            throw new NotFoundException(
              "Aucun compte de type Coffre-fort n'a été trouvé pour cette filiale.",
            );
          }

          const year = new Date().getFullYear();
          const count = await tx.cashRemittance.count();
          const reference = `RC-${year}-${String(count + 1).padStart(4, '0')}`;

          const remittance = await tx.cashRemittance.create({
            data: {
              id: generateId(ID_PREFIXES.CASHREMITTANCE),
              reference,
              declaredAmount,
              remittanceDate,
              status: CashRemittanceStatus.SUBMITTED,
              notes: dto.notes,
              sourceCashRegisterId: sourceAccount.id,
              destinationSafeId: destinationSafe.id,
              subsidiaryId: user.subsidiaryId,
              createdByUserId: user.id,
              ...(receiptIds.length
                ? {
                    receipts: {
                      create: receiptIds.map((financialTransactionId) => ({
                        financialTransactionId,
                      })),
                    },
                  }
                : {}),
            },
            include: REMITTANCE_INCLUDE,
          });

          return this.serializeRemittance(remittance);
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2002' || error.code === 'P2034')
      ) {
        throw new ConflictException(
          'Une autre opération de caisse est en cours. Actualisez la remise et réessayez.',
        );
      }
      throw error;
    }
  }

  async findAll(user: JwtUser) {
    const activeRole = user.activeRole ?? user.role;
    const isSuperAdmin = (user.roles ?? [user.role]).includes(
      UserRole.SUPER_ADMIN,
    );

    const where: Prisma.CashRemittanceWhereInput = {};
    if (!isSuperAdmin) {
      if (!user.subsidiaryId) {
        throw new ForbiddenException(
          'Une filiale active est requise pour consulter les remises de caisse.',
        );
      }
      where.subsidiaryId = user.subsidiaryId;
      if (activeRole === UserRole.CAISSIER) {
        if (!user.id) {
          throw new ForbiddenException('Un utilisateur connecté est requis.');
        }
        where.createdByUserId = user.id;
      }
    }

    const remittances = await this.prisma.cashRemittance.findMany({
      where,
      include: REMITTANCE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return remittances.map((remittance) =>
      this.serializeRemittance(remittance),
    );
  }

  async receive(id: string, dto: ReceiveCashRemittanceDto, user: JwtUser) {
    checkActiveRole(
      user,
      [UserRole.FINANCIAL_DIRECTOR],
      'Seul le directeur financier peut réceptionner une remise de caisse.',
    );

    return this.prisma.$transaction(async (tx) => {
      const remittance = await tx.cashRemittance.findUnique({
        where: { id },
      });
      if (!remittance) {
        throw new NotFoundException(
          `Remise de caisse avec l'ID "${id}" introuvable.`,
        );
      }

      // Le DF ne réceptionne que les remises de sa filiale source.
      assertSubsidiaryAccess(
        remittance.subsidiaryId,
        resolveScopeContext(user),
      );

      if (remittance.status !== CashRemittanceStatus.SUBMITTED) {
        throw new BadRequestException(
          `Cette remise ne peut pas être réceptionnée (statut actuel : ${remittance.status}).`,
        );
      }

      const receivedAmount = new Prisma.Decimal(dto.receivedAmount);
      const discrepancy = receivedAmount.minus(remittance.declaredAmount);
      if (!discrepancy.isZero()) {
        throw new BadRequestException(
          'La remise ne peut pas être validée : le montant compté doit correspondre au montant déclaré.',
        );
      }
      const newStatus = CashRemittanceStatus.RECEIVED;

      const claim = await tx.cashRemittance.updateMany({
        where: {
          id,
          status: CashRemittanceStatus.SUBMITTED,
          declaredAmount: remittance.declaredAmount,
        },
        data: {
          status: newStatus,
          receivedAmount,
          discrepancy,
          notes: dto.notes ?? remittance.notes,
          receivedByUserId: user.id,
        },
      });

      if (!claim.count) {
        throw new BadRequestException('Cette remise a déjà été traitée.');
      }

      const debit = await tx.treasuryAccount.updateMany({
        where: {
          id: remittance.sourceCashRegisterId,
          subsidiaryId: remittance.subsidiaryId,
          accountType: AccountType.CASH_REGISTER,
          balance: { gte: remittance.declaredAmount },
        },
        data: { balance: { decrement: remittance.declaredAmount } },
      });
      if (!debit.count) {
        throw new BadRequestException(
          'Le solde de la caisse est insuffisant pour cette remise.',
        );
      }
      const updatedSource = await tx.treasuryAccount.findUniqueOrThrow({
        where: { id: remittance.sourceCashRegisterId },
        select: { balance: true },
      });

      const credit = await tx.treasuryAccount.updateMany({
        where: {
          id: remittance.destinationSafeId,
          subsidiaryId: remittance.subsidiaryId,
          accountType: AccountType.SAFE,
        },
        data: { balance: { increment: receivedAmount } },
      });
      if (!credit.count) {
        throw new BadRequestException(
          'Le coffre-fort destinataire est introuvable dans la filiale de cette remise.',
        );
      }
      const updatedDest = await tx.treasuryAccount.findUniqueOrThrow({
        where: { id: remittance.destinationSafeId },
        select: { balance: true },
      });

      const transaction = await tx.financialTransaction.create({
        data: {
          id: generateId(ID_PREFIXES.TREASURY),
          description: `Versement remise de caisse ${remittance.reference}`,
          amount: receivedAmount,
          financialTransactionType: TransactionType.DEPENSE,
          treasuryAccountId: remittance.sourceCashRegisterId,
          sourceAccountId: remittance.sourceCashRegisterId,
          destinationAccountId: remittance.destinationSafeId,
          reference: remittance.reference,
          subsidiaryId: remittance.subsidiaryId,
          transactionDate: new Date(),
          status: TransactionStatus.VALIDE,
          balanceAfterSource: updatedSource.balance,
          balanceAfterDest: updatedDest.balance,
        },
      });

      await this.accountingOutbox.enqueue(tx, {
        eventType: 'TREASURY_TRANSFER',
        subsidiaryId: remittance.subsidiaryId,
        payload: {
          userId: user.id,
          operationDate: new Date().toISOString(),
          amount: Number(receivedAmount),
          description: `Versement remise de caisse ${remittance.reference}`,
          sourceId: transaction.id,
          accountType: AccountType.CASH_REGISTER,
          destinationAccountType: AccountType.SAFE,
        },
      });

      const updatedRemittance = await tx.cashRemittance.findUnique({
        where: { id },
        include: REMITTANCE_INCLUDE,
      });
      return updatedRemittance
        ? this.serializeRemittance(updatedRemittance)
        : null;
    });
  }
}
