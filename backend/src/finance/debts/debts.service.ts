import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { User, UserRole, DebtStatus, TransactionType } from '@prisma/client';
import { CreateSupplierDebtDto } from './dto/create-supplier-debt.dto';
import { PaySupplierDebtDto } from './dto/pay-supplier-debt.dto';
import { TreasuryService } from '../treasury/treasury.service';
import { CreateLongTermDebtDto } from './dto/create-long-term-debt.dto';
import { UpdateLongTermDebtDto } from './dto/update-long-term-debt.dto';

@Injectable()
export class DebtsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => TreasuryService))
    private treasuryService: TreasuryService,
  ) {}

  // ================================================================= //
  //                         SUPPLIER DEBTS                            //
  // ================================================================= //

  async createSupplierDebt(dto: CreateSupplierDebtDto, user: User) {
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR, UserRole.PURCHASING_MANAGER];
    // Le `user` vient du token JWT, la propriété est `role`, pas `userRole`.
    const userRole = (user as any).role || user.userRole;
    if (!allowedRoles.includes(userRole)) {
      throw new ForbiddenException('Permission denied to create supplier debts.');
    }

    return this.prisma.supplierDebt.create({
      data: {
        ...dto,
        dueDate: new Date(dto.dueDate),
        status: DebtStatus.A_PAYER,
        subsidiaryId: user.subsidiaryId,
      },
    });
  }

  async findAllSupplierDebts(user: User) {
    return this.prisma.supplierDebt.findMany({
      where: { subsidiaryId: user.subsidiaryId },
      orderBy: { dueDate: 'asc' },
    });
  }

  async paySupplierDebt(id: string, dto: PaySupplierDebtDto, user: User) {
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR, UserRole.CAISSIER];
    // Le `user` vient du token JWT, la propriété est `role`, pas `userRole`.
    const userRole = (user as any).role || user.userRole;
    if (!allowedRoles.includes(userRole)) {
      throw new ForbiddenException('Permission denied to pay supplier debts.');
    }

    const debt = await this.prisma.supplierDebt.findFirst({
      where: { id, subsidiaryId: user.subsidiaryId },
    });

    if (!debt) {
      throw new NotFoundException(`Supplier debt with ID "${id}" not found.`);
    }

    // Utilisation d'une transaction Prisma pour garantir l'atomicité
    return this.prisma.$transaction(async (tx) => {
      // 1. Mettre à jour le statut de la dette
      const updatedDebt = await tx.supplierDebt.update({
        where: { id },
        data: { status: DebtStatus.PAYER },
      });

      // 2. Créer la transaction financière correspondante
      await this.treasuryService.createTransaction({
        transactionDate: new Date(dto.paymentDate).toISOString(),
        description: `Paiement facture fournisseur: ${debt.supplierName} - Facture N°${debt.invoiceId}`,
        financialTransactionType: TransactionType.DEPENSE,
        amount: debt.amount,
        treasuryAccountId: dto.treasuryAccountId,
        relatedDocumentId: debt.id,
      }, user);

      return updatedDebt;
    });
  }

  // ================================================================= //
  //                         LONG-TERM DEBTS                           //
  // ================================================================= //

  async createLongTermDebt(dto: CreateLongTermDebtDto, user: User) {
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR];
    // Le `user` vient du token JWT, la propriété est `role`, pas `userRole`.
    const userRole = (user as any).role || user.userRole;
    if (!allowedRoles.includes(userRole)) {
      throw new ForbiddenException('Permission denied to create long-term debts.');
    }

    return this.prisma.longTermDebt.create({
      data: {
        ...dto,
        currentBalance: dto.initialAmount,
        maturityDate: new Date(dto.maturityDate),
        subsidiaryId: user.subsidiaryId,
      },
    });
  }

  async findAllLongTermDebts(user: User) {
    return this.prisma.longTermDebt.findMany({
      where: { subsidiaryId: user.subsidiaryId },
      orderBy: { maturityDate: 'asc' },
    });
  }

  async updateLongTermDebt(id: string, dto: UpdateLongTermDebtDto, user: User) {
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR];
    // Le `user` vient du token JWT, la propriété est `role`, pas `userRole`.
    const userRole = (user as any).role || user.userRole;
    if (!allowedRoles.includes(userRole)) {
      throw new ForbiddenException('Permission denied to update long-term debts.');
    }
    
    const debt = await this.prisma.longTermDebt.findFirst({
        where: { id, subsidiaryId: user.subsidiaryId },
    });

    if (!debt) {
        throw new NotFoundException(`Long-term debt with ID "${id}" not found.`);
    }

    return this.prisma.longTermDebt.update({
        where: { id },
        data: dto,
    });
  }
}
