import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
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
} satisfies Prisma.CashRemittanceInclude;

/**
 * Remise de caisse : la caisse (CASH_REGISTER) ne fait l'objet d'aucun
 * décaissement direct (voir TreasuryService.createDisbursement), seulement
 * de remises vers le coffre-fort (SAFE) du siège — trésorerie centralisée,
 * comme gmo (Backend_GMO/src/cash_transfer/cash_transfer.service.ts). Le
 * Directeur Financier DE LA FILIALE DE LA CAISSE (pas celle du coffre)
 * réceptionne et confirme le comptage réel.
 */
@Injectable()
export class CashRemittanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountingOutbox: AccountingOutboxService,
  ) {}

  async create(dto: CreateCashRemittanceDto, user: JwtUser) {
    const activeRole = user.activeRole ?? user.role;
    if (activeRole !== UserRole.CAISSIER) {
      throw new ForbiddenException(
        'Seul un caissier peut initier une remise de caisse.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // La caisse source est toujours celle assignée au caissier connecté —
      // jamais une caisse choisie librement.
      const sourceAccount = await tx.treasuryAccount.findFirst({
        where: {
          cashierId: user.id,
          subsidiaryId: user.subsidiaryId,
          accountType: AccountType.CASH_REGISTER,
        },
      });
      if (!sourceAccount) {
        throw new NotFoundException(
          "Aucune caisse n'est associée à votre compte. Contactez l'administrateur.",
        );
      }

      const declaredAmount = new Prisma.Decimal(dto.declaredAmount);
      if (sourceAccount.balance.comparedTo(declaredAmount) < 0) {
        throw new BadRequestException(
          `Le montant déclaré (${dto.declaredAmount}) dépasse le solde de la caisse (${Number(sourceAccount.balance)}).`,
        );
      }

      const headquarter = await tx.subsidiary.findFirst({
        where: { isHeadquarter: true },
      });
      if (!headquarter) {
        throw new NotFoundException("Le siège n'a pas été configuré.");
      }

      const destinationSafe = await tx.treasuryAccount.findFirst({
        where: {
          subsidiaryId: headquarter.id,
          accountType: AccountType.SAFE,
        },
      });
      if (!destinationSafe) {
        throw new NotFoundException(
          "Aucun compte de type Coffre-fort n'a été trouvé pour le siège.",
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
        },
        include: REMITTANCE_INCLUDE,
      });

      return remittance;
    });
  }

  async findAll(user: JwtUser) {
    const activeRole = user.activeRole ?? user.role;
    const isSuperAdmin = (user.roles ?? [user.role]).includes(
      UserRole.SUPER_ADMIN,
    );

    const where: Prisma.CashRemittanceWhereInput = {};
    if (!isSuperAdmin) {
      if (activeRole === UserRole.CAISSIER) {
        where.createdByUserId = user.id;
      } else {
        // Directeur financier (et autres rôles de supervision) : uniquement
        // les remises de leur propre filiale (celle de la caisse source).
        where.subsidiaryId = user.subsidiaryId;
      }
    }

    return this.prisma.cashRemittance.findMany({
      where,
      include: REMITTANCE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
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

      // Le DF ne réceptionne que les remises DE SA PROPRE filiale (celle de
      // la caisse source), pas celle du coffre destinataire (toujours siège).
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
      const newStatus = discrepancy.isZero()
        ? CashRemittanceStatus.RECEIVED
        : CashRemittanceStatus.RECEIVED_WITH_DISCREPANCY;

      const updatedSource = await tx.treasuryAccount.update({
        where: { id: remittance.sourceCashRegisterId },
        data: { balance: { decrement: remittance.declaredAmount } },
      });

      const updatedDest = await tx.treasuryAccount.update({
        where: { id: remittance.destinationSafeId },
        data: { balance: { increment: receivedAmount } },
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

      await tx.cashRemittance.update({
        where: { id },
        data: {
          status: newStatus,
          receivedAmount,
          discrepancy,
          notes: dto.notes ?? remittance.notes,
          receivedByUserId: user.id,
        },
      });

      return tx.cashRemittance.findUnique({
        where: { id },
        include: REMITTANCE_INCLUDE,
      });
    });
  }
}
