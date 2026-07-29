import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { UserRole } from '@prisma/client';
import { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';
import { checkRole } from 'src/common/auth/role/check-role.util';
import { AccountingOutboxService } from 'src/accounting/outbox/accounting-outbox.service';
import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountingOutbox: AccountingOutboxService,
  ) {}

  async create(createExpenseDto: CreateExpenseDto, user: JwtUser) {
    checkRole(
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

  async findAll(user: JwtUser) {
    checkRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR, UserRole.CAISSIER],
      'You do not have permission to view expenses.',
    );

    return this.prisma.expenseRecord.findMany({
      where: {
        subsidiaryId: user.subsidiaryId,
      },
      orderBy: {
        expenseDate: 'desc',
      },
    });
  }

  async findOne(id: string, user: JwtUser) {
    const expense = await this.prisma.expenseRecord.findUnique({
      where: { id },
    });

    if (!expense) {
      throw new NotFoundException(`Expense with ID "${id}" not found.`);
    }

    // Vérifie que la charge appartient à la filiale de l'utilisateur
    if (expense.subsidiaryId !== user.subsidiaryId) {
      throw new ForbiddenException(
        'You do not have permission to view this expense.',
      );
    }

    return expense;
  }

  async update(id: string, updateExpenseDto: UpdateExpenseDto, user: JwtUser) {
    await this.findOne(id, user);
    checkRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR],
      'You do not have permission to update an expense.',
    );

    return this.prisma.expenseRecord.update({
      where: { id },
      data: {
        ...updateExpenseDto,
        amount: updateExpenseDto.amount,
        expenseDate: updateExpenseDto.expenseDate
          ? new Date(updateExpenseDto.expenseDate)
          : undefined,
      },
    });
  }

  async remove(id: string, user: JwtUser) {
    await this.findOne(id, user);
    checkRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR],
      'You do not have permission to delete an expense.',
    );

    return this.prisma.expenseRecord.delete({
      where: { id },
    });
  }
}
