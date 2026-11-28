import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import {
  AccountType,
  AccountingOutboxStatus,
  ExpenseStatus,
  Prisma,
  TransactionStatus,
  TransactionType,
  TreasuryTransactionType,
  UserRole,
} from '@prisma/client';
import { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';
import {
  checkActiveRole,
  checkRole,
} from 'src/common/auth/role/check-role.util';
import { AccountingOutboxService } from 'src/accounting/outbox/accounting-outbox.service';
import { FileUploadService } from 'src/common/utils/file-upload.service';
import { SystemAuditService } from 'src/common/audit/system-audit.service';
import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';
import { paginate } from 'src/common/pagination/pagination';
import { PayExpenseDto } from './dto/pay-expense.dto';
import {
  resolveScopeContext,
  withSubsidiaryScope,
} from '../../common/utils/subsidiary-scope';

const paymentDetails = {
  paymentTransaction: {
    select: {
      id: true,
      transactionDate: true,
      reference: true,
      status: true,
      treasuryAccount: { select: { id: true, accountName: true } },
    },
  },
} satisfies Prisma.ExpenseRecordInclude;

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountingOutbox: AccountingOutboxService,
    @Optional() private readonly fileUploadService?: FileUploadService,
    @Optional() private readonly systemAudit?: SystemAuditService,
  ) {}

  async create(createExpenseDto: CreateExpenseDto, user: JwtUser) {
    checkActiveRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR],
      'You do not have permission to create an expense.',
    );

    const { isPendingInvoice, proofFilePath, ...rest } = createExpenseDto;
    const status = isPendingInvoice
      ? ExpenseStatus.PENDING_INVOICE
      : ExpenseStatus.DRAFT;

    const record = await this.prisma.expenseRecord.create({
      data: {
        id: generateId(ID_PREFIXES.EXPENSE),
        ...rest,
        amount: isPendingInvoice ? Math.max(0, rest.amount ?? 0) : rest.amount,
        expenseDate: new Date(createExpenseDto.expenseDate),
        subsidiaryId: user.subsidiaryId,
        status,
        proofFilePath: proofFilePath ?? null,
        createdById: user.id,
      },
    });

    await this.systemAudit?.log({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.activeRole,
      subsidiaryId: user.subsidiaryId,
      action: 'EXPENSE_CREATED',
      entityType: 'ExpenseRecord',
      entityId: record.id,
      summary: `Création charge "${record.description}" (${Number(record.amount)} FCFA, ${status})`,
      metadata: { status, amount: Number(record.amount) },
    });

    return record;
  }

  async attachProof(id: string, file: Express.Multer.File, user: JwtUser) {
    if (!file) {
      throw new BadRequestException('Aucun fichier justificatif fourni.');
    }
    const expense = await this.findOne(id, user);
    if (
      expense.status === ExpenseStatus.PAID ||
      expense.status === ExpenseStatus.REJECTED
    ) {
      throw new ConflictException(
        'Impossible de joindre un justificatif sur une charge réglée ou rejetée.',
      );
    }
    if (!this.fileUploadService) {
      throw new BadRequestException('Service de téléversement indisponible.');
    }

    const uploaded = await this.fileUploadService.uploadFile(
      file.buffer,
      file.originalname,
      {
        privateSubsidiaryId: expense.subsidiaryId,
        subfolder: 'expense-proofs',
      },
    );

    return this.prisma.expenseRecord.update({
      where: { id },
      data: { proofFilePath: uploaded.url },
      include: paymentDetails,
    });
  }

  async confirmInvoice(
    id: string,
    dto: { amount: number; description?: string; expenseDate?: string },
    user: JwtUser,
  ) {
    checkActiveRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR, UserRole.SUPER_ADMIN],
      'Seul un administrateur ou directeur financier peut confirmer le montant de la facture.',
    );
    const expense = await this.findOne(id, user);
    if (
      expense.status !== ExpenseStatus.PENDING_INVOICE &&
      expense.status !== ExpenseStatus.DRAFT
    ) {
      throw new ConflictException(
        `Le montant ne peut plus être confirmé au statut ${expense.status}.`,
      );
    }
    if (!dto?.amount || Number(dto.amount) <= 0) {
      throw new BadRequestException(
        'Le montant confirmé de la facture doit être strictement positif.',
      );
    }

    const updated = await this.prisma.expenseRecord.update({
      where: { id },
      data: {
        amount: dto.amount,
        description: dto.description?.trim() || expense.description,
        expenseDate: dto.expenseDate
          ? new Date(dto.expenseDate)
          : expense.expenseDate,
        status: ExpenseStatus.DRAFT,
      },
      include: paymentDetails,
    });

    await this.systemAudit?.log({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.activeRole,
      subsidiaryId: expense.subsidiaryId,
      action: 'EXPENSE_INVOICE_CONFIRMED',
      entityType: 'ExpenseRecord',
      entityId: id,
      summary: `Montant confirmé sur facture "${expense.description}" : ${Number(updated.amount)} FCFA`,
      metadata: { amount: Number(updated.amount) },
    });

    return updated;
  }

  async approve(id: string, user: JwtUser) {
    checkActiveRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR, UserRole.SUPER_ADMIN],
      'Seul un administrateur ou directeur financier peut approuver une charge.',
    );
    const expense = await this.findOne(id, user);
    if (expense.status !== ExpenseStatus.DRAFT) {
      throw new ConflictException(
        `Seule une charge en brouillon (DRAFT) peut être approuvée (statut actuel : ${expense.status}).`,
      );
    }
    if (expense.amount.lte(0)) {
      throw new BadRequestException(
        'Impossible d’approuver une charge dont le montant est nul ou négatif.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const claim = await tx.expenseRecord.updateMany({
        where: { id, status: ExpenseStatus.DRAFT },
        data: {
          status: ExpenseStatus.APPROVED,
          approvedById: user.id,
          approvedAt: new Date(),
        },
      });
      if (claim.count !== 1) {
        throw new ConflictException('Cette charge a déjà été traitée.');
      }

      await this.accountingOutbox.enqueue(tx, {
        eventType: 'EXPENSE_RECORD',
        subsidiaryId: expense.subsidiaryId,
        payload: {
          userId: user.id,
          operationDate: expense.expenseDate.toISOString(),
          amount: Number(expense.amount),
          description: expense.description,
          sourceId: expense.id,
          expenseCategory: expense.category,
          withTva: true,
        },
      });

      await this.systemAudit?.log({
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.activeRole,
        subsidiaryId: expense.subsidiaryId,
        action: 'EXPENSE_APPROVED',
        entityType: 'ExpenseRecord',
        entityId: id,
        summary: `Approbation charge "${expense.description}" (${Number(expense.amount)} FCFA)`,
        metadata: { amount: Number(expense.amount) },
      });

      return tx.expenseRecord.findUniqueOrThrow({
        where: { id },
        include: paymentDetails,
      });
    });
  }

  async reject(id: string, reason: string | undefined, user: JwtUser) {
    checkActiveRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR, UserRole.SUPER_ADMIN],
      'Seul un administrateur ou directeur financier peut rejeter une charge.',
    );
    const trimmed = reason?.trim() ?? '';
    if (trimmed.length < 3) {
      throw new BadRequestException(
        'Un motif de rejet (min. 3 caractères) est obligatoire.',
      );
    }

    const expense = await this.findOne(id, user);
    if (expense.status === ExpenseStatus.PAID || expense.paymentTransactionId) {
      throw new ConflictException(
        'Impossible de rejeter une charge déjà réglée.',
      );
    }

    const updated = await this.prisma.expenseRecord.update({
      where: { id },
      data: {
        status: ExpenseStatus.REJECTED,
        rejectionReason: trimmed,
        approvedById: user.id,
        approvedAt: new Date(),
      },
      include: paymentDetails,
    });

    await this.systemAudit?.log({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.activeRole,
      subsidiaryId: expense.subsidiaryId,
      action: 'EXPENSE_REJECTED',
      entityType: 'ExpenseRecord',
      entityId: id,
      summary: `Rejet charge "${expense.description}" : ${trimmed}`,
      metadata: { reason: trimmed },
    });

    return updated;
  }

  async findAll(
    user: JwtUser,
    paginationQuery: PaginationQueryDto = {},
    subsidiaryId = user.subsidiaryId,
  ) {
    checkRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR, UserRole.CAISSIER],
      'You do not have permission to view expenses.',
    );

    const where: Prisma.ExpenseRecordWhereInput = withSubsidiaryScope(
      {},
      resolveScopeContext(user),
      subsidiaryId,
    );
    if (paginationQuery.search) {
      where.description = {
        contains: paginationQuery.search,
        mode: 'insensitive',
      };
    }

    return paginate(
      this.prisma.expenseRecord,
      {
        where,
        orderBy: [{ expenseDate: 'desc' }, { id: 'asc' }],
        include: paymentDetails,
      },
      paginationQuery,
    );
  }

  findPayable(user: JwtUser, pagination: PaginationQueryDto) {
    checkActiveRole(
      user,
      [UserRole.SUPER_ADMIN, UserRole.FINANCIAL_DIRECTOR, UserRole.ADMIN],
      'Permission refusée pour consulter les charges à régler.',
    );
    const search = pagination.search?.trim();
    const ctx = resolveScopeContext(user);
    return paginate(
      this.prisma.expenseRecord,
      {
        where: withSubsidiaryScope(
          {
            paymentTransactionId: null,
            status: ExpenseStatus.APPROVED,
            amount: { gt: 0 },
            ...(search && {
              description: { contains: search, mode: 'insensitive' },
            }),
          },
          ctx,
        ),
        include: { subsidiary: { select: { subsidiaryName: true } } },
        orderBy: [{ expenseDate: 'desc' }, { id: 'asc' }],
      },
      pagination,
    );
  }

  async pay(id: string, dto: PayExpenseDto, user: JwtUser) {
    checkActiveRole(
      user,
      [UserRole.SUPER_ADMIN, UserRole.FINANCIAL_DIRECTOR, UserRole.ADMIN],
      'Seul le Super-Admin, le Directeur Financier ou l’Admin peut régler une charge.',
    );
    const targetAccountId = dto.accountId || dto.safeId;
    if (!targetAccountId) {
      throw new BadRequestException(
        'Sélectionnez un compte de trésorerie (Coffre-fort, Banque ou Caisse Dépenses).',
      );
    }

    if (!dto.accountId && dto.safeId) {
      checkActiveRole(
        user,
        [UserRole.SUPER_ADMIN],
        'Seul le super-administrateur peut régler une charge depuis le coffre-fort.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const expense = await tx.expenseRecord.findUnique({ where: { id } });
      if (!expense) throw new NotFoundException('Charge introuvable.');
      if (expense.paymentTransactionId)
        throw new ConflictException('Cette charge est déjà réglée.');
      if (
        expense.status === ExpenseStatus.PENDING_INVOICE ||
        expense.status === ExpenseStatus.DRAFT ||
        expense.status === ExpenseStatus.REJECTED ||
        expense.status === ExpenseStatus.PAID
      ) {
        throw new ConflictException(
          `La charge doit être approuvée avant règlement (statut actuel : ${expense.status}).`,
        );
      }
      if (expense.amount.lte(0))
        throw new BadRequestException(
          'Le montant de la charge doit être positif.',
        );
      if (!expense.amount.equals(dto.expectedAmount))
        throw new ConflictException(
          'Le montant de la charge a changé. Actualisez avant de la régler.',
        );

      const safe = dto.accountId
        ? await tx.treasuryAccount.findFirst({
            where: {
              id: dto.accountId,
              accountType: {
                in: [
                  AccountType.SAFE,
                  AccountType.BANQUE,
                  AccountType.EXPENSE_BOX,
                ],
              },
            },
          })
        : await tx.treasuryAccount.findFirst({
            where: { id: dto.safeId, accountType: AccountType.SAFE },
          });
      if (!safe)
        throw new BadRequestException(
          'Sélectionnez un compte de trésorerie valide.',
        );
      const resolvedAccountType = safe.accountType ?? AccountType.SAFE;
      if (safe.currency !== 'XAF' && safe.currency !== 'XOF')
        throw new BadRequestException(
          'Sélectionnez un compte en FCFA (XAF) pour régler cette charge.',
        );

      if (
        resolvedAccountType === AccountType.SAFE &&
        user.activeRole !== UserRole.SUPER_ADMIN
      ) {
        throw new ForbiddenException(
          'Seul le super-administrateur peut régler une charge depuis le coffre-fort.',
        );
      }

      if (
        resolvedAccountType !== AccountType.SAFE &&
        safe.subsidiaryId !== expense.subsidiaryId
      ) {
        throw new BadRequestException(
          'Le compte de paiement doit appartenir à la même filiale que la charge.',
        );
      }

      const subsidiary = tx.subsidiary
        ? await tx.subsidiary.findUnique({
            where: { id: expense.subsidiaryId },
            select: {
              expenseBoxUnitLimit: true,
              safeMakerCheckerThreshold: true,
            },
          })
        : null;

      if (resolvedAccountType === AccountType.EXPENSE_BOX && subsidiary) {
        const unitLimit = Number(subsidiary.expenseBoxUnitLimit ?? 50000);
        if (unitLimit > 0 && Number(expense.amount) > unitLimit) {
          throw new BadRequestException(
            `Montant (${Number(expense.amount)} FCFA) supérieur au plafond unitaire de Caisse Dépenses (${unitLimit} FCFA). Réglez via Coffre-fort ou Banque.`,
          );
        }
      }

      const requiresMakerChecker =
        resolvedAccountType === AccountType.BANQUE ||
        (resolvedAccountType === AccountType.SAFE &&
          subsidiary &&
          Number(subsidiary.safeMakerCheckerThreshold ?? 0) > 0 &&
          Number(expense.amount) >=
            Number(subsidiary.safeMakerCheckerThreshold));

      if (requiresMakerChecker) {
        const payment = await tx.financialTransaction.create({
          data: {
            transactionDate: new Date(dto.transactionDate),
            description: `Règlement de la charge : ${expense.description}`,
            amount: expense.amount,
            subsidiaryId: safe.subsidiaryId,
            financialTransactionType: TransactionType.DEPENSE,
            treasuryAccountId: safe.id,
            sourceAccountId: safe.id,
            status: TransactionStatus.EN_ATTENTE,
            treasuryType: TreasuryTransactionType.OTHER_EXPENSE,
            reference: dto.reference?.trim() || expense.id,
            relatedDocumentId: expense.id,
            proofFilePath: expense.proofFilePath,
            createdByUserId: user.id,
          },
        });
        await tx.expenseRecord.updateMany({
          where: { id, paymentTransactionId: null },
          data: { paymentTransactionId: payment.id },
        });
        return tx.expenseRecord.findUniqueOrThrow({
          where: { id },
          include: paymentDetails,
        });
      }

      const balanceBeforeSource = safe.balance;
      const debit = await tx.treasuryAccount.updateMany({
        where: {
          id: safe.id,
          accountType: safe.accountType ?? AccountType.SAFE,
          subsidiaryId: safe.subsidiaryId,
          balance: { gte: expense.amount },
        },
        data: { balance: { decrement: expense.amount } },
      });
      if (debit.count !== 1)
        throw new BadRequestException(
          `Solde insuffisant dans le compte "${safe.accountName ?? 'sélectionné'}".`,
        );
      const { balance } = await tx.treasuryAccount.findUniqueOrThrow({
        where: { id: safe.id },
        select: { balance: true },
      });
      const payment = await tx.financialTransaction.create({
        data: {
          transactionDate: new Date(dto.transactionDate),
          description: `Règlement de la charge : ${expense.description}`,
          amount: expense.amount,
          subsidiaryId: safe.subsidiaryId,
          financialTransactionType: TransactionType.DEPENSE,
          treasuryAccountId: safe.id,
          sourceAccountId: safe.id,
          status: TransactionStatus.VALIDE,
          treasuryType: TreasuryTransactionType.OTHER_EXPENSE,
          reference: dto.reference?.trim() || expense.id,
          proofFilePath: expense.proofFilePath,
          createdByUserId: user.id,
          approvedByUserId: user.id,
          approvedAt: new Date(),
          ...(balanceBeforeSource !== undefined ? { balanceBeforeSource } : {}),
          balanceAfterSource: balance,
        },
      });
      const claimed = await tx.expenseRecord.updateMany({
        where: {
          id,
          subsidiaryId: expense.subsidiaryId,
          paymentTransactionId: null,
          amount: expense.amount,
          description: expense.description,
        },
        data: {
          paymentTransactionId: payment.id,
          status: ExpenseStatus.PAID,
        },
      });
      if (claimed.count !== 1)
        throw new ConflictException(
          'Cette charge a été modifiée ou réglée entre-temps.',
        );

      // Réactive l'écriture d'engagement des charges créées avant que
      // le processeur ne prenne en charge EXPENSE_RECORD.
      await tx.accountingOutboxEntry.updateMany({
        where: {
          subsidiaryId: expense.subsidiaryId,
          eventType: 'EXPENSE_RECORD',
          status: AccountingOutboxStatus.FAILED,
          lastError: "Type d'événement inconnu: EXPENSE_RECORD",
          payload: { path: ['sourceId'], equals: expense.id },
        },
        data: {
          status: AccountingOutboxStatus.PENDING,
          attempts: 0,
          lastError: null,
        },
      });
      await this.accountingOutbox.enqueue(tx, {
        eventType: 'EXPENSE_RECORD_PAYMENT',
        subsidiaryId: expense.subsidiaryId,
        payload: {
          userId: user.id,
          operationDate: payment.transactionDate.toISOString(),
          amount: Number(expense.amount),
          description: payment.description ?? expense.description,
          sourceId: payment.id,
          accountType: safe.accountType ?? AccountType.SAFE,
        },
      });
      return tx.expenseRecord.findUniqueOrThrow({
        where: { id },
        include: paymentDetails,
      });
    });
  }

  async findOne(id: string, user: JwtUser) {
    const expense = await this.prisma.expenseRecord.findUnique({
      where: { id },
      include: paymentDetails,
    });

    if (!expense) {
      throw new NotFoundException(`Expense with ID "${id}" not found.`);
    }

    // Vérifie que la charge appartient à la filiale de l'utilisateur
    if (
      expense.subsidiaryId !== user.subsidiaryId &&
      !resolveScopeContext(user).hasGlobalScope
    ) {
      throw new ForbiddenException(
        'You do not have permission to view this expense.',
      );
    }

    return expense;
  }

  async update(id: string, updateExpenseDto: UpdateExpenseDto, user: JwtUser) {
    const expense = await this.findOne(id, user);
    checkActiveRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR],
      'You do not have permission to update an expense.',
    );

    if (expense.paymentTransactionId)
      throw new ConflictException('Cette charge est déjà réglée.');
    const updated = await this.prisma.expenseRecord.updateMany({
      where: {
        id,
        paymentTransactionId: null,
        subsidiaryId: expense.subsidiaryId,
      },
      data: {
        ...updateExpenseDto,
        amount: updateExpenseDto.amount,
        expenseDate: updateExpenseDto.expenseDate
          ? new Date(updateExpenseDto.expenseDate)
          : undefined,
      },
    });
    if (updated.count !== 1)
      throw new ConflictException(
        'Cette charge a été modifiée ou réglée entre-temps.',
      );
    return this.findOne(id, user);
  }

  async remove(id: string, user: JwtUser) {
    const expense = await this.findOne(id, user);
    checkActiveRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR],
      'You do not have permission to delete an expense.',
    );

    if (expense.paymentTransactionId)
      throw new ConflictException('Cette charge est déjà réglée.');
    const deleted = await this.prisma.expenseRecord.deleteMany({
      where: {
        id,
        paymentTransactionId: null,
        subsidiaryId: expense.subsidiaryId,
      },
    });
    if (deleted.count !== 1)
      throw new ConflictException(
        'Cette charge a été modifiée ou réglée entre-temps.',
      );
    return expense;
  }
}
