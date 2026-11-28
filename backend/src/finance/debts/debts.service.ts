import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import {
  UserRole,
  DebtStatus,
  TransactionType,
  TransactionStatus,
  PaymentStatus,
  AccountType,
  NotificationType,
  SupplierCreditNoteStatus,
  Prisma,
} from '@prisma/client';
import { PaySupplierDebtDto } from './dto/pay-supplier-debt.dto';
import { CreateLongTermDebtDto } from './dto/create-long-term-debt.dto';
import { UpdateLongTermDebtDto } from './dto/update-long-term-debt.dto';
import { CreateSupplierCreditNoteDto } from './dto/create-supplier-credit-note.dto';
import { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';
import { checkActiveRole } from 'src/common/auth/role/check-role.util';
import { AccountingOutboxService } from 'src/accounting/outbox/accounting-outbox.service';
import { SystemAuditService } from 'src/common/audit/system-audit.service';
import { NotificationsService } from 'src/notifications/notifications.service';

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
    @Optional() private readonly systemAudit?: SystemAuditService,
    @Optional()
    private readonly notificationsService?: NotificationsService,
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
    checkActiveRole(
      user,
      [UserRole.SUPER_ADMIN, UserRole.FINANCIAL_DIRECTOR],
      'Seul le Super-Admin ou le Directeur Financier peut régler une dette fournisseur.',
    );

    const debt = await this.prisma.supplierDebt.findFirst({
      where: { id },
      include: { purchaseOrder: true },
    });
    if (!debt) {
      throw new NotFoundException(`Supplier debt with ID "${id}" not found.`);
    }
    if (
      user.activeRole !== UserRole.SUPER_ADMIN &&
      debt.subsidiaryId !== user.subsidiaryId
    ) {
      throw new ForbiddenException(
        'Vous ne pouvez régler que les dettes fournisseurs de votre filiale.',
      );
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
    if (account.subsidiaryId !== debt.subsidiaryId) {
      throw new BadRequestException(
        'Le compte de trésorerie et la dette fournisseur doivent appartenir à la même filiale.',
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

    const subsidiary = this.prisma.subsidiary
      ? await this.prisma.subsidiary.findUnique({
          where: { id: account.subsidiaryId },
          select: { safeMakerCheckerThreshold: true },
        })
      : null;
    const safeThreshold = Number(subsidiary?.safeMakerCheckerThreshold ?? 0);
    const requiresMakerChecker =
      account.accountType === AccountType.BANQUE ||
      (account.accountType === AccountType.SAFE &&
        safeThreshold > 0 &&
        Number(paymentAmount) >= safeThreshold);

    if (requiresMakerChecker) {
      const pendingTx = await this.prisma.financialTransaction.create({
        data: {
          id: generateId(ID_PREFIXES.TREASURY),
          description: `Paiement facture fournisseur: ${debt.supplierName} - Facture N°${debt.invoiceId}`,
          amount: paymentAmount,
          financialTransactionType: TransactionType.DEPENSE,
          treasuryAccountId: account.id,
          sourceAccountId: account.id,
          subsidiaryId: account.subsidiaryId,
          transactionDate: new Date(dto.paymentDate),
          status: TransactionStatus.EN_ATTENTE,
          relatedDocumentId: debt.id,
          supplierDebtId: debt.id,
          createdByUserId: user.id,
        },
      });

      await this.systemAudit?.log({
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.activeRole,
        subsidiaryId: account.subsidiaryId,
        action: 'SUPPLIER_DEBT_PAYMENT_REQUESTED',
        entityType: 'SupplierDebt',
        entityId: debt.id,
        summary: `Demande paiement dette fournisseur ${debt.supplierName} (${Number(paymentAmount)} FCFA)`,
        metadata: {
          transactionId: pendingTx.id,
          amount: Number(paymentAmount),
          accountType: account.accountType,
        },
      });

      await this.notificationsService?.notifyUsersByRole(
        account.subsidiaryId,
        UserRole.SUPER_ADMIN,
        {
          title: 'Paiement fournisseur à approuver',
          message: `Paiement de ${Number(paymentAmount)} FCFA pour ${debt.supplierName} (${account.accountName}) en attente de validation.`,
          type: NotificationType.SYSTEM_ALERT,
          data: { transactionId: pendingTx.id, supplierDebtId: debt.id },
        },
      );

      return {
        ...debt,
        amount: Number(debt.amount),
        pendingApproval: true,
        pendingTransaction: pendingTx,
      };
    }

    return this.prisma.$transaction(async (tx) => {
      const balanceBeforeSource = account.balance;
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
          supplierDebtId: debt.id,
          createdByUserId: user.id,
          approvedByUserId: user.id,
          approvedAt: new Date(),
          balanceBeforeSource,
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
  //                      SUPPLIER CREDIT NOTES                        //
  // ================================================================= //

  async findAllSupplierCreditNotes(
    user: JwtUser,
    paginationQuery: PaginationQueryDto = {},
  ) {
    const ctx = resolveScopeContext(user);
    const result = await paginate(
      this.prisma.supplierCreditNote,
      {
        where: withSubsidiaryScope({}, ctx),
        include: {
          supplierDebt: {
            select: {
              id: true,
              invoiceId: true,
              supplierName: true,
              amount: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      paginationQuery,
    );
    return {
      ...result,
      data: result.data.map((note) => ({
        ...note,
        amount: Number(note.amount),
        appliedAmount: Number(note.appliedAmount),
      })),
    };
  }

  async createSupplierCreditNote(
    dto: CreateSupplierCreditNoteDto,
    user: JwtUser,
  ) {
    checkActiveRole(
      user,
      [UserRole.SUPER_ADMIN, UserRole.FINANCIAL_DIRECTOR, UserRole.ADMIN],
      'Permission refusée pour enregistrer un avoir fournisseur.',
    );

    const debt = await this.prisma.supplierDebt.findUnique({
      where: { id: dto.supplierDebtId },
    });
    if (!debt) {
      throw new NotFoundException(
        `Dette fournisseur "${dto.supplierDebtId}" introuvable.`,
      );
    }
    if (
      user.activeRole !== UserRole.SUPER_ADMIN &&
      debt.subsidiaryId !== user.subsidiaryId
    ) {
      throw new ForbiddenException(
        'Vous ne pouvez créer un avoir que sur une dette de votre filiale.',
      );
    }

    const creditNote = await this.prisma.supplierCreditNote.create({
      data: {
        creditNoteNumber: dto.creditNoteNumber.trim(),
        supplierName: debt.supplierName,
        supplierDebtId: debt.id,
        purchaseOrderId: debt.purchaseOrderId,
        amount: dto.amount,
        appliedAmount: 0,
        reason: dto.reason.trim(),
        proofFilePath: dto.proofFilePath,
        status: SupplierCreditNoteStatus.ACTIVE,
        subsidiaryId: debt.subsidiaryId,
        createdById: user.id,
      },
    });

    await this.systemAudit?.log({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.activeRole,
      subsidiaryId: debt.subsidiaryId,
      action: 'SUPPLIER_CREDIT_NOTE_CREATED',
      entityType: 'SupplierCreditNote',
      entityId: creditNote.id,
      summary: `Avoir fournisseur ${creditNote.creditNoteNumber} créé (${Number(creditNote.amount)} FCFA)`,
      metadata: {
        creditNoteNumber: creditNote.creditNoteNumber,
        amount: Number(creditNote.amount),
        supplierDebtId: debt.id,
      },
    });

    return {
      ...creditNote,
      amount: Number(creditNote.amount),
      appliedAmount: Number(creditNote.appliedAmount),
    };
  }

  async applySupplierCreditNote(creditNoteId: string, user: JwtUser) {
    checkActiveRole(
      user,
      [UserRole.SUPER_ADMIN, UserRole.FINANCIAL_DIRECTOR],
      'Seul le Super-Admin ou le Directeur Financier peut imputer un avoir fournisseur.',
    );

    return this.prisma.$transaction(async (tx) => {
      const note = await tx.supplierCreditNote.findUnique({
        where: { id: creditNoteId },
      });
      if (!note) {
        throw new NotFoundException('Avoir fournisseur introuvable.');
      }
      if (note.status !== SupplierCreditNoteStatus.ACTIVE) {
        throw new BadRequestException(
          `Cet avoir ne peut pas être imputé (statut : ${note.status}).`,
        );
      }
      if (!note.supplierDebtId) {
        throw new BadRequestException(
          'Cet avoir n’est rattaché à aucune dette fournisseur.',
        );
      }

      const debt = await tx.supplierDebt.findUnique({
        where: { id: note.supplierDebtId },
        include: { purchaseOrder: true },
      });
      if (!debt) {
        throw new NotFoundException('Dette fournisseur rattachée introuvable.');
      }
      if (debt.status === DebtStatus.PAYER || debt.amount.lte(0)) {
        throw new BadRequestException(
          'Cette dette fournisseur est déjà soldée.',
        );
      }

      const remainingNote = new Prisma.Decimal(note.amount).sub(
        note.appliedAmount,
      );
      if (remainingNote.lte(0)) {
        throw new BadRequestException(
          'Cet avoir est déjà entièrement consommé.',
        );
      }

      const appliedNow = remainingNote.greaterThan(debt.amount)
        ? debt.amount
        : remainingNote;
      const newDebtBalance = debt.amount.sub(appliedNow);
      const newDebtStatus = newDebtBalance.isZero()
        ? DebtStatus.PAYER
        : DebtStatus.PARTIELLEMENT_PAYE;

      const updatedDebt = await tx.supplierDebt.update({
        where: { id: debt.id },
        data: { amount: newDebtBalance, status: newDebtStatus },
      });

      const po = debt.purchaseOrder;
      const newPoPaid = po.amountPaid.add(appliedNow);
      const newPoStatus = newPoPaid.gte(po.totalAmount)
        ? PaymentStatus.PAID
        : PaymentStatus.PARTIALLY_PAID;
      await tx.purchaseOrder.update({
        where: { id: po.id },
        data: { amountPaid: newPoPaid, paymentStatus: newPoStatus },
      });
      await tx.purchaseOrderHistory.create({
        data: {
          purchaseOrderId: po.id,
          eventName: `Avoir fournisseur ${note.creditNoteNumber} imputé (${Number(appliedNow)} FCFA)`,
        },
      });

      const totalApplied = new Prisma.Decimal(note.appliedAmount).add(
        appliedNow,
      );
      const updatedNote = await tx.supplierCreditNote.update({
        where: { id: note.id },
        data: {
          appliedAmount: totalApplied,
          status: totalApplied.gte(note.amount)
            ? SupplierCreditNoteStatus.APPLIED
            : SupplierCreditNoteStatus.ACTIVE,
        },
      });

      await this.accountingOutbox.enqueue(tx, {
        eventType: 'SUPPLIER_CREDIT_NOTE',
        subsidiaryId: debt.subsidiaryId,
        payload: {
          userId: user.id,
          operationDate: new Date().toISOString(),
          amount: Number(appliedNow),
          description: `Imputation avoir fournisseur ${note.creditNoteNumber} — ${debt.supplierName}`,
          sourceId: updatedNote.id,
        },
      });

      await this.systemAudit?.log({
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.activeRole,
        subsidiaryId: debt.subsidiaryId,
        action: 'SUPPLIER_CREDIT_NOTE_APPLIED',
        entityType: 'SupplierCreditNote',
        entityId: note.id,
        summary: `Avoir ${note.creditNoteNumber} imputé (${Number(appliedNow)} FCFA) sur dette ${debt.supplierName}`,
        metadata: {
          creditNoteNumber: note.creditNoteNumber,
          appliedAmount: Number(appliedNow),
          remainingDebt: Number(newDebtBalance),
        },
      });

      return {
        creditNote: {
          ...updatedNote,
          amount: Number(updatedNote.amount),
          appliedAmount: Number(updatedNote.appliedAmount),
        },
        debt: updatedDebt,
      };
    });
  }

  // ================================================================= //
  //                         LONG-TERM DEBTS                           //
  // ================================================================= //

  async createLongTermDebt(dto: CreateLongTermDebtDto, user: JwtUser) {
    checkActiveRole(
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
    checkActiveRole(
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
