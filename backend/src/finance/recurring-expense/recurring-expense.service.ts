import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { AccountingOutboxService } from 'src/accounting/outbox/accounting-outbox.service';
import { CreateRecurringExpenseDto } from './dto/create-recurring-expense.dto';
import { UpdateRecurringExpenseDto } from './dto/update-recurring-expense.dto';
import {
  ExpenseCategory,
  RecurringExpenseFrequency,
  UserRole,
} from '@prisma/client';
import { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';
import { checkRole } from 'src/common/auth/role/check-role.util';
import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';
import { paginate } from 'src/common/pagination/pagination';

// Le salaire est piloté par le module paie (PayrollRecord), pas par une
// dépense récurrente générique — éviter la double comptabilisation.
const BLOCKED_RECURRING_CATEGORIES: ExpenseCategory[] = [
  ExpenseCategory.SALARIES,
];

@Injectable()
export class RecurringExpenseService {
  private readonly logger = new Logger(RecurringExpenseService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly accountingOutbox: AccountingOutboxService,
  ) {}

  async create(dto: CreateRecurringExpenseDto, user: JwtUser) {
    checkRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR],
      'You do not have permission to create a recurring expense.',
    );

    if (BLOCKED_RECURRING_CATEGORIES.includes(dto.category)) {
      throw new BadRequestException(
        `La catégorie "${dto.category}" est pilotée par le module paie et ne peut pas être configurée en dépense récurrente.`,
      );
    }

    const startDate = new Date(dto.startDate);

    return this.prisma.recurringExpense.create({
      data: {
        id: generateId(ID_PREFIXES.RECURRINGEXPENSE),
        description: dto.description,
        amount: dto.amount,
        category: dto.category,
        expenseRecordType: dto.expenseRecordType,
        frequency: dto.frequency,
        startDate,
        nextExecutionDate: startDate,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        subsidiaryId: user.subsidiaryId,
      },
    });
  }

  async findAll(user: JwtUser, paginationQuery: PaginationQueryDto = {}) {
    checkRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR],
      'You do not have permission to view recurring expenses.',
    );

    return paginate(
      this.prisma.recurringExpense,
      {
        where: { subsidiaryId: user.subsidiaryId },
        orderBy: { nextExecutionDate: 'asc' },
      },
      paginationQuery,
    );
  }

  async findOne(id: string, user: JwtUser) {
    const recurringExpense = await this.prisma.recurringExpense.findFirst({
      where: { id, subsidiaryId: user.subsidiaryId },
    });

    if (!recurringExpense) {
      throw new NotFoundException(
        `Recurring expense with ID "${id}" not found.`,
      );
    }

    return recurringExpense;
  }

  async update(id: string, dto: UpdateRecurringExpenseDto, user: JwtUser) {
    await this.findOne(id, user);
    checkRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR],
      'You do not have permission to update a recurring expense.',
    );

    if (dto.category && BLOCKED_RECURRING_CATEGORIES.includes(dto.category)) {
      throw new BadRequestException(
        `La catégorie "${dto.category}" est pilotée par le module paie et ne peut pas être configurée en dépense récurrente.`,
      );
    }

    return this.prisma.recurringExpense.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async remove(id: string, user: JwtUser) {
    await this.findOne(id, user);
    checkRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR],
      'You do not have permission to delete a recurring expense.',
    );

    return this.prisma.recurringExpense.delete({ where: { id } });
  }

  /**
   * Génère quotidiennement une ExpenseRecord pour chaque dépense récurrente
   * active dont l'échéance est atteinte, puis recalcule la prochaine échéance
   * (ou désactive si `endDate` est dépassée) — même pattern Outbox que
   * ExpensesService.create pour la journalisation comptable automatique.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processRecurringExpenses() {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const dueExpenses = await this.prisma.recurringExpense.findMany({
      where: { isActive: true, nextExecutionDate: { lte: today } },
    });

    for (const recurring of dueExpenses) {
      try {
        await this.prisma.$transaction(async (tx) => {
          const record = await tx.expenseRecord.create({
            data: {
              id: generateId(ID_PREFIXES.EXPENSE),
              description: recurring.description,
              amount: recurring.amount,
              category: recurring.category,
              expenseRecordType: recurring.expenseRecordType,
              expenseDate: recurring.nextExecutionDate,
              subsidiaryId: recurring.subsidiaryId,
            },
          });

          await this.accountingOutbox.enqueue(tx, {
            eventType: 'EXPENSE_RECORD',
            subsidiaryId: recurring.subsidiaryId,
            payload: {
              // Généré par le cron, pas par un utilisateur — userId non
              // consommé par JournalizationService (voir accounting-outbox.service.ts).
              userId: 'SYSTEM_RECURRING_EXPENSE',
              operationDate: record.expenseDate.toISOString(),
              amount: Number(record.amount),
              description: record.description,
              sourceId: record.id,
              expenseCategory: record.category,
              withTva: true,
            },
          });

          const nextExecutionDate = this.computeNextExecutionDate(
            recurring.nextExecutionDate,
            recurring.frequency,
          );
          const isPastEndDate =
            !!recurring.endDate && nextExecutionDate > recurring.endDate;

          await tx.recurringExpense.update({
            where: { id: recurring.id },
            data: {
              nextExecutionDate,
              isActive: isPastEndDate ? false : recurring.isActive,
            },
          });
        });

        this.logger.log(
          `✓ Dépense récurrente générée: ${recurring.description} (${recurring.id})`,
        );
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        this.logger.error(
          `Erreur lors de la génération de la dépense récurrente ${recurring.id}: ${error.message}`,
          error.stack,
        );
      }
    }
  }

  private computeNextExecutionDate(
    from: Date,
    frequency: RecurringExpenseFrequency,
  ): Date {
    const next = new Date(from);
    switch (frequency) {
      case RecurringExpenseFrequency.WEEKLY:
        next.setDate(next.getDate() + 7);
        break;
      case RecurringExpenseFrequency.MONTHLY:
        next.setMonth(next.getMonth() + 1);
        break;
      case RecurringExpenseFrequency.YEARLY:
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
    return next;
  }
}
