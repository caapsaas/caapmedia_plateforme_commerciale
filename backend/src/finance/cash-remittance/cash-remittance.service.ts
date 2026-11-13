import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import {
  UserRole,
  AccountType,
  TransactionType,
  TransactionStatus,
  CashRemittanceStatus,
  Prisma,
} from '@prisma/client';
import { CreateCashRemittanceDto } from './dto/create-cash-remittance.dto';
import { ReceiveCashRemittanceDto } from './dto/receive-cash-remittance.dto';
import { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';
import { checkRole } from 'src/common/auth/role/check-role.util';
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

  async findSourceAccounts(user: JwtUser) {
    const accounts = await this.prisma.treasuryAccount.findMany({
      where: this.sourceAccountScope(user),
      select: { id: true, accountName: true, balance: true },
      orderBy: { accountName: 'asc' },
    });

    const { start, end } = this.doualaDayRange();

    return Promise.all(
      accounts.map(async (account) => {
        const receipts = await this.prisma.financialTransaction.findMany({
          where: {
            treasuryAccountId: account.id,
            subsidiaryId: user.subsidiaryId,
            financialTransactionType: TransactionType.RECETTE,
            status: TransactionStatus.VALIDE,
            relatedDocumentId: { not: null },
            transactionDate: {
              gte: start,
              lt: end,
            },
          },
          select: { id: true, relatedDocumentId: true, amount: true },
        });
        const orderIds = [
          ...new Set(
            receipts
              .map((receipt) => receipt.relatedDocumentId)
              .filter((id): id is string => id !== null),
          ),
        ];
        const [orders, remittedReceipts, legacyRemittedOrders] = await Promise.all([
          orderIds.length
            ? this.prisma.order.findMany({
                where: {
                  id: { in: orderIds },
                  subsidiaryId: user.subsidiaryId,
                },
                select: { id: true, customerName: true },
              })
            : Promise.resolve([]),
          receipts.length
            ? this.prisma.cashRemittanceReceipt.findMany({
                where: {
                  financialTransactionId: {
                    in: receipts.map((receipt) => receipt.id),
                  },
                },
                select: { financialTransactionId: true },
              })
            : Promise.resolve([]),
          orderIds.length
            ? this.prisma.cashRemittanceOrder.findMany({
                where: { orderId: { in: orderIds } },
                select: { orderId: true },
              })
            : Promise.resolve([]),
        ]);
        const customerByOrder = new Map(
          orders.map((order) => [order.id, order.customerName]),
        );
        const remittedReceiptIds = new Set(
          remittedReceipts.map((receipt) => receipt.financialTransactionId),
        );
        const legacyRemittedOrderIds = new Set(
          legacyRemittedOrders.map((link) => link.orderId),
        );
        const availableReceipts = receipts
          .filter(
            (receipt) =>
              !remittedReceiptIds.has(receipt.id) &&
              !legacyRemittedOrderIds.has(receipt.relatedDocumentId ?? ''),
          )
          .map((receipt) => ({
            receiptId: receipt.id,
            orderId: receipt.relatedDocumentId!,
            customerName:
              customerByOrder.get(receipt.relatedDocumentId!) ?? 'Client',
            amount: Number(receipt.amount),
          }));
        const dailyCollectedAmount = availableReceipts.reduce(
          (sum, receipt) => sum + receipt.amount,
          0,
        );
        return {
          ...account,
          // Prisma Decimal est sérialisé en chaîne JSON ; le frontend attend
          // des nombres (formatCurrency affiche 0 pour une chaîne).
          balance: Number(account.balance),
          dailyCollectedAmount,
          availableReceipts,
        };
      }),
    );
  }

  async create(dto: CreateCashRemittanceDto, user: JwtUser) {
    const sourceAccountScope = this.sourceAccountScope(user);
    const receiptIds = [...new Set(dto.receiptIds ?? [])];
    if (!receiptIds.length) {
      throw new BadRequestException(
        'Sélectionnez au moins un encaissement pour cette remise.',
      );
    }
    const { start, end } = this.doualaDayRange();

    try {
      return await this.prisma.$transaction(async (tx) => {
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

        const alreadyRemitted = await tx.cashRemittanceReceipt.findMany({
          where: { financialTransactionId: { in: receiptIds } },
          select: { financialTransactionId: true },
        });
        if (alreadyRemitted.length) {
          throw new ConflictException(
            'Un encaissement sélectionné figure déjà dans une remise de caisse.',
          );
        }

        const receipts = await tx.financialTransaction.findMany({
          where: {
            id: { in: receiptIds },
            treasuryAccountId: sourceAccount.id,
            subsidiaryId: sourceAccount.subsidiaryId,
            financialTransactionType: TransactionType.RECETTE,
            status: TransactionStatus.VALIDE,
            relatedDocumentId: { not: null },
            transactionDate: { gte: start, lt: end },
          },
          select: { id: true, relatedDocumentId: true, amount: true },
        });
        if (receipts.length !== receiptIds.length) {
          throw new BadRequestException(
            'Un ou plusieurs encaissements sont introuvables, déjà remis ou hors de cette caisse.',
          );
        }

        const orderIds = [
          ...new Set(
            receipts
              .map((receipt) => receipt.relatedDocumentId)
              .filter((id): id is string => id !== null),
          ),
        ];
        const legacyRemittedOrders = await tx.cashRemittanceOrder.findMany({
          where: { orderId: { in: orderIds } },
          select: { orderId: true },
        });
        if (legacyRemittedOrders.length) {
          throw new ConflictException(
            'Une commande incluse dans une ancienne remise ne peut pas être remise de nouveau.',
          );
        }

        const orders = await tx.order.findMany({
          where: {
            id: { in: orderIds },
            subsidiaryId: sourceAccount.subsidiaryId,
          },
          select: { id: true },
        });
        if (orders.length !== orderIds.length) {
          throw new BadRequestException(
            'Une ou plusieurs commandes ne sont pas rattachées à votre filiale.',
          );
        }

        const declaredAmount = receipts.reduce(
          (total, receipt) => total.add(receipt.amount),
          new Prisma.Decimal(0),
        );
        if (sourceAccount.balance.comparedTo(declaredAmount) < 0) {
          throw new BadRequestException(
            `Le montant déclaré (${Number(declaredAmount)}) dépasse le solde de la caisse (${Number(sourceAccount.balance)}).`,
          );
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
            remittanceDate: new Date(dto.remittanceDate),
            status: CashRemittanceStatus.SUBMITTED,
            notes: dto.notes,
            sourceCashRegisterId: sourceAccount.id,
            destinationSafeId: destinationSafe.id,
            subsidiaryId: user.subsidiaryId,
            createdByUserId: user.id,
            receipts: {
              create: receiptIds.map((receiptId) => ({
                financialTransaction: { connect: { id: receiptId } },
              })),
            },
          },
          include: REMITTANCE_INCLUDE,
        });

        return this.serializeRemittance(remittance);
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Un encaissement vient d’être affecté à une autre remise de caisse.',
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
    checkRole(
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
        where: { id, status: CashRemittanceStatus.SUBMITTED },
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
