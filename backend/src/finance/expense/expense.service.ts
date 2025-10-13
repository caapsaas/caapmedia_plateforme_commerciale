import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { User, UserRole } from '@prisma/client';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createExpenseDto: CreateExpenseDto, user: User) {
    // Seuls les rôles financiers ou admin peuvent créer des charges
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR];

    // Le `user` vient du token JWT, la propriété est `role`, pas `userRole`.
    const userRole = (user as any).role || user.userRole;
    if (!allowedRoles.includes(userRole)) {
      throw new ForbiddenException('You do not have permission to create an expense.');
    }

    return this.prisma.expenseRecord.create({
      data: {
        ...createExpenseDto,
        expenseDate: new Date(createExpenseDto.expenseDate),
        subsidiaryId: user.subsidiaryId,
      },
    });
  }

  async findAll(user: User) {
    // Tous les utilisateurs autorisés voient les charges de leur filiale
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR, UserRole.CAISSIER];
    // Le `user` vient du token JWT, la propriété est `role`, pas `userRole`.
    const userRole = (user as any).role || user.userRole;
    if (!allowedRoles.includes(userRole)) {
      throw new ForbiddenException('You do not have permission to view expenses.');
    }

    return this.prisma.expenseRecord.findMany({
      where: {
        subsidiaryId: user.subsidiaryId,
      },
      orderBy: {
        expenseDate: 'desc',
      },
    });
  }

  async findOne(id: string, user: User) {
    const expense = await this.prisma.expenseRecord.findUnique({
      where: { id },
    });

    if (!expense) {
      throw new NotFoundException(`Expense with ID "${id}" not found.`);
    }

    // Vérifie que la charge appartient à la filiale de l'utilisateur
    if (expense.subsidiaryId !== user.subsidiaryId) {
      throw new ForbiddenException('You do not have permission to view this expense.');
    }

    return expense;
  }

  async update(id: string, updateExpenseDto: UpdateExpenseDto, user: User) {
    await this.findOne(id, user); // Vérifie l'existence et les droits

    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR];
    // Le `user` vient du token JWT, la propriété est `role`, pas `userRole`.
    const userRole = (user as any).role || user.userRole;
    if (!allowedRoles.includes(userRole)) {
      throw new ForbiddenException('You do not have permission to update an expense.');
    }

    return this.prisma.expenseRecord.update({
      where: { id },
      data: {
        ...updateExpenseDto,
        amount: updateExpenseDto.amount,
        expenseDate: updateExpenseDto.expenseDate ? new Date(updateExpenseDto.expenseDate) : undefined,
      },
    });
  }

  async remove(id: string, user: User) {
    await this.findOne(id, user); // Vérifie l'existence et les droits

    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR];
    // Le `user` vient du token JWT, la propriété est `role`, pas `userRole`.
    const userRole = (user as any).role || user.userRole;
    if (!allowedRoles.includes(userRole)) {
      throw new ForbiddenException('You do not have permission to delete an expense.');
    }

    return this.prisma.expenseRecord.delete({
      where: { id },
    });
  }
}
