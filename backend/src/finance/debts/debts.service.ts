import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import {
  UserRole,
  DebtStatus,
  TransactionType,
  TransactionStatus,
  PaymentStatus,
  AccountType,
  Prisma,
} from '@prisma/client';
import { PaySupplierDebtDto } from './dto/pay-supplier-debt.dto';
import { CreateLongTermDebtDto } from './dto/create-long-term-debt.dto';
import { UpdateLongTermDebtDto } from './dto/update-long-term-debt.dto';
import { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';
import { checkRole } from 'src/common/auth/role/check-role.util';
import { AccountingOutboxService } from 'src/accounting/outbox/accounting-outbox.service';

import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';
import { paginate } from 'src/common/pagination/pagination';
import {
  resolveScopeContext,
  withSubsidiaryScope,
} from 'src/common/utils/subsidiary-scope';
@Injectable()
export class DebtsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountingOutbox: AccountingOutboxService,
  ) {}

  // ================================================================= //
  //                         SUPPLIER DEBTS                            //
  // ================================================================= //
  // Une dette fournisseur résulte TOUJOURS d'un achat non payé — elle est
  // créée automatiquement avec le bon de commande (voir
  // PurchaseOrdersService.create) et ne peut jamais être créée à la main :
  // aucune route de création n'existe ici, volontairement.

  async findAllSupplierDebts(
    user: JwtUser,
    paginationQuery: PaginationQueryDto = {},
  ) {
    // Un SUPER_ADMIN doit voir les dettes fournisseurs de TOUTES les
    // filiales (le frontend filtre ensuite côté client par filiale
    // sélectionnée, voir SupplierDebts.tsx) — sans ce bypass, il ne voyait
    // jamais que les dettes de sa propre filiale de rattachement (le siège).
    const ctx = resolveScopeContext(user);
    const debtInclude = {
      purchaseOrder: { select: { totalAmount: true, amountPaid: true } },
      // Nécessaire pour afficher une colonne Filiale côté frontend en vue
      // consolidée SUPER_ADMIN (voir SupplierDebts.tsx) — même pattern que
      // PurchaseOrder.subsidiary.
      subsidiary: { select: { subsidiaryName: true } },
    } satisfies Prisma.SupplierDebtInclude;
    const result = await paginate(
      this.prisma.supplierDebt,
      {
        // "Dettes fournisseur" == suivi des sommes encore dues : une dette
        // soldée (PAYER) n'a plus rien à faire ici (elle a déjà eu son
        // paiement, tracé côté FinancialTransaction/historique du bon de
        // commande) — sinon la liste grossit indéfiniment de dettes réglées.
        where: withSubsidiaryScope({ status: { not: DebtStatus.PAYER } }, ctx),
        orderBy: { dueDate: 'asc' },
        // Nécessaire pour que la modale de paiement affiche le même
        // récapitulatif (Total / Payé / Reste) que côté Achats — voir
        // PaySupplierDebtModal.tsx.
        include: debtInclude,
      },
      paginationQuery,
    );
    type DebtWithPO = Prisma.SupplierDebtGetPayload<{
      include: typeof debtInclude;
    }>;
    // Le montant Decimal arrive en JSON sous forme de chaîne — formatCurrency
    // (frontend) le traite alors comme invalide et affiche 0.
    return {
      ...result,
      data: (result.data as DebtWithPO[]).map((d) => ({
        ...d,
        amount: Number(d.amount),
        subsidiary: d.subsidiary
          ? { subsidiaryName: d.subsidiary.subsidiaryName }
          : undefined,
        purchaseOrder: d.purchaseOrder
          ? {
              totalAmount: Number(d.purchaseOrder.totalAmount),
              amountPaid: Number(d.purchaseOrder.amountPaid),
            }
          : undefined,
      })),
    };
  }

  /**
   * Paiement d'une dette fournisseur — le paiement d'un achat se fait
   * exclusivement depuis le Coffre-fort ou une Banque (comptes centralisés
   * au siège), et exclusivement par le SUPER_ADMIN, comme tout décaissement
   * SAFE/BANQUE (voir TreasuryService.createDisbursement). La dette ET le
   * bon de commande lié sont mis à jour dans la MÊME transaction Prisma que
   * le débit du compte, garantissant l'atomicité et l'absence de désync
   * entre les deux (contrairement à l'ancien double-chemin de paiement).
   */
  async paySupplierDebt(id: string, dto: PaySupplierDebtDto, user: JwtUser) {
    checkRole(
      user,
      [],
      'Seul le super-administrateur peut payer une dette fournisseur.',
    );

    const debt = await this.prisma.supplierDebt.findFirst({
      where: { id },
      include: { purchaseOrder: true },
    });
    if (!debt) {
      throw new NotFoundException(`Supplier debt with ID "${id}" not found.`);
    }
    if (debt.status === DebtStatus.PAYER) {
      throw new BadRequestException('Cette dette est déjà payée.');
    }

    const account = await this.prisma.treasuryAccount.findFirst({
      where: { id: dto.treasuryAccountId },
    });
    if (!account) {
      throw new NotFoundException(
        `Treasury account with ID "${dto.treasuryAccountId}" not found.`,
      );
    }
    if (
      account.accountType !== AccountType.SAFE &&
      account.accountType !== AccountType.BANQUE
    ) {
      throw new BadRequestException(
        "Le paiement d'une dette fournisseur ne peut se faire que depuis le coffre-fort ou une banque.",
      );
    }

    const paymentAmount = dto.amount
      ? new Prisma.Decimal(dto.amount)
      : debt.amount;
    if (paymentAmount.lte(0)) {
      throw new BadRequestException('Le montant à payer doit être positif.');
    }
    if (paymentAmount.greaterThan(debt.amount)) {
      throw new BadRequestException(
        'Le montant ne peut pas dépasser le solde restant de la dette.',
      );
    }
    if (account.balance.comparedTo(paymentAmount) < 0) {
      throw new BadRequestException(
        `Solde insuffisant sur "${account.accountName}". Solde: ${Number(account.balance)}, Montant: ${Number(paymentAmount)}.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedAccount = await tx.treasuryAccount.update({
        where: { id: account.id },
        data: { balance: { decrement: paymentAmount } },
      });

      const remainingDebt = debt.amount.sub(paymentAmount);
      // paymentAmount > 0 est garanti par la validation plus haut, donc
      // remainingDebt < debt.amount systématiquement : dès qu'un paiement
      // (même partiel) a été enregistré, le statut ne doit plus rester
      // A_PAYER (qui signifie "aucun paiement reçu").
      const newDebtStatus = remainingDebt.isZero()
        ? DebtStatus.PAYER
        : DebtStatus.PARTIELLEMENT_PAYE;
      const updatedDebt = await tx.supplierDebt.update({
        where: { id },
        data: { amount: remainingDebt, status: newDebtStatus },
      });

      // Synchronise le bon de commande lié — plus jamais désynchronisé de sa
      // dette, les deux étant mis à jour dans la même transaction.
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
          eventName: `Paiement de ${Number(paymentAmount)} enregistré (${account.accountName})`,
        },
      });

      const transaction = await tx.financialTransaction.create({
        data: {
          id: generateId(ID_PREFIXES.TREASURY),
          description: `Paiement facture fournisseur: ${debt.supplierName} - Facture N°${debt.invoiceId}`,
          amount: paymentAmount,
          financialTransactionType: TransactionType.DEPENSE,
          treasuryAccountId: account.id,
          sourceAccountId: account.id,
          // L'écriture appartient à la filiale du compte source (siège pour
          // Coffre-fort/Banque), pas à celle de l'acheteur — même convention
          // que TreasuryService.createDisbursement.
          subsidiaryId: account.subsidiaryId,
          transactionDate: new Date(dto.paymentDate),
          status: TransactionStatus.VALIDE,
          relatedDocumentId: debt.id,
          balanceAfterSource: updatedAccount.balance,
        },
      });

      // Intention de journalisation posée dans la MÊME transaction (pattern Outbox).
      await this.accountingOutbox.enqueue(tx, {
        eventType: 'SUPPLIER_DEBT_PAYMENT',
        subsidiaryId: account.subsidiaryId,
        payload: {
          userId: user.id,
          operationDate: new Date(dto.paymentDate).toISOString(),
          amount: Number(paymentAmount),
          description: transaction.description,
          sourceId: transaction.id,
          accountType: account.accountType,
        },
      });

      return updatedDebt;
    });
  }

  // ================================================================= //
  //                         LONG-TERM DEBTS                           //
  // ================================================================= //

  async createLongTermDebt(dto: CreateLongTermDebtDto, user: JwtUser) {
    checkRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR],
      'Permission denied to create long-term debts.',
    );

    return this.prisma.longTermDebt.create({
      data: {
        id: generateId(ID_PREFIXES.LONGTERDEBT),
        ...dto,
        currentBalance: dto.initialAmount,
        maturityDate: new Date(dto.maturityDate),
        subsidiaryId: user.subsidiaryId,
      },
    });
  }

  async findAllLongTermDebts(
    user: JwtUser,
    paginationQuery: PaginationQueryDto = {},
  ) {
    const ctx = resolveScopeContext(user);
    const result = await paginate(
      this.prisma.longTermDebt,
      {
        where: withSubsidiaryScope({}, ctx),
        orderBy: { maturityDate: 'asc' },
      },
      paginationQuery,
    );
    return {
      ...result,
      data: result.data.map((d) => ({
        ...d,
        initialAmount: Number(d.initialAmount),
        currentBalance: Number(d.currentBalance),
        interestRate: Number(d.interestRate),
      })),
    };
  }

  async updateLongTermDebt(
    id: string,
    dto: UpdateLongTermDebtDto,
    user: JwtUser,
  ) {
    checkRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR],
      'Permission denied to update long-term debts.',
    );

    const debt = await this.prisma.longTermDebt.findFirst({
      where: { id, subsidiaryId: user.subsidiaryId },
    });

    if (!debt) {
      throw new NotFoundException(`Long-term debt with ID "${id}" not found.`);
    }

    return this.prisma.longTermDebt.update({ where: { id }, data: dto });
  }
}
