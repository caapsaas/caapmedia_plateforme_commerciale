import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import {
  AccountType,
  AccountingOutboxStatus,
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
      treasuryAccount: { select: { id: true, accountName: true } },
    },
  },
} satisfies Prisma.ExpenseRecordInclude;

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountingOutbox: AccountingOutboxService,
  ) {}

  async create(createExpenseDto: CreateExpenseDto, user: JwtUser) {
    checkActiveRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR],
      'You do not have permission to create an expense.',
    );

    return this.prisma.$transaction(async (tx) => {
      const record = await tx.expenseRecord.create({
        data: {
          id: generateId(ID_PREFIXES.EXPENSE),
          ...createExpenseDto,
          expenseDate: new Date(createExpenseDto.expenseDate),
          subsidiaryId: user.subsidiaryId,
        },
      });

      // Intention de journalisation posée dans la MÊME transaction (pattern Outbox).
      await this.accountingOutbox.enqueue(tx, {
        eventType: 'EXPENSE_RECORD',
        subsidiaryId: user.subsidiaryId,
        payload: {
          userId: user.id,
          operationDate: record.expenseDate.toISOString(),
          amount: Number(record.amount),
          description: record.description,
          sourceId: record.id,
          expenseCategory: record.category,
          withTva: true,
        },
      });

      return record;
    });
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
      [UserRole.SUPER_ADMIN],
      'Seul le super-administrateur peut régler une charge depuis le coffre-fort.',
    );
    const search = pagination.search?.trim();
    return paginate(
      this.prisma.expenseRecord,
      {
        where: {
          paymentTransactionId: null,
          amount: { gt: 0 },
          ...(search && {
            description: { contains: search, mode: 'insensitive' },
          }),
        },
        include: { subsidiary: { select: { subsidiaryName: true } } },
        orderBy: [{ expenseDate: 'desc' }, { id: 'asc' }],
      },
      pagination,
    );
  }

  async pay(id: string, dto: PayExpenseDto, user: JwtUser) {
    checkActiveRole(
      user,
      [UserRole.SUPER_ADMIN],
      'Seul le super-administrateur peut régler une charge depuis le coffre-fort.',
    );
    return this.prisma.$transaction(async (tx) => {
      const expense = await tx.expenseRecord.findUnique({ where: { id } });
      if (!expense) throw new NotFoundException('Charge introuvable.');
      if (expense.paymentTransactionId)
        throw new ConflictException('Cette charge est déjà réglée.');
      if (expense.amount.lte(0))
        throw new BadRequestException(
          'Le montant de la charge doit être positif.',
        );
      if (!expense.amount.equals(dto.expectedAmount))
        throw new ConflictException(
          'Le montant de la charge a changé. Actualisez avant de la régler.',
        );

      const safe = await tx.treasuryAccount.findFirst({
        where: { id: dto.safeId, accountType: AccountType.SAFE },
      });
      if (!safe)
        throw new BadRequestException('Sélectionnez un coffre-fort valide.');
      if (safe.currency !== 'XAF' && safe.currency !== 'XOF')
        throw new BadRequestException(
          'Sélectionnez un coffre-fort en FCFA (XAF) pour régler cette charge.',
        );

      const debit = await tx.treasuryAccount.updateMany({
        where: {
          id: safe.id,
          accountType: AccountType.SAFE,
          subsidiaryId: safe.subsidiaryId,
          balance: { gte: expense.amount },
        },
        data: { balance: { decrement: expense.amount } },
      });
      if (debit.count !== 1)
        throw new BadRequestException('Solde insuffisant dans le coffre-fort.');
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
        data: { paymentTransactionId: payment.id },
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
          accountType: AccountType.SAFE,
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
