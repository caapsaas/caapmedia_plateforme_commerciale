import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { UserRole, DebtStatus, TransactionType, Prisma } from '@prisma/client';
import { CreateSupplierDebtDto } from './dto/create-supplier-debt.dto';
import { PaySupplierDebtDto } from './dto/pay-supplier-debt.dto';
import { TreasuryService } from '../treasury/treasury.service';
import { CreateLongTermDebtDto } from './dto/create-long-term-debt.dto';
import { UpdateLongTermDebtDto } from './dto/update-long-term-debt.dto';
import { validate as isUUID } from 'uuid';
import { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';
import { checkRole } from 'src/common/auth/role/check-role.util';

import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';
@Injectable()
export class DebtsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly treasuryService: TreasuryService,
  ) {}

  private validateSubsidiaryId(subsidiaryId: string) {
    if (!isUUID(subsidiaryId)) {
      throw new BadRequestException(
        'ID de filiale invalide dans le token utilisateur.',
      );
    }
  }

  // ================================================================= //
  //                         SUPPLIER DEBTS                            //
  // ================================================================= //

  async createSupplierDebt(dto: CreateSupplierDebtDto, user: JwtUser) {
    checkRole(
      user,
      [
        UserRole.ADMIN,
        UserRole.FINANCIAL_DIRECTOR,
        UserRole.PURCHASING_MANAGER,
      ],
      'Permission denied to create supplier debts.',
    );
    this.validateSubsidiaryId(user.subsidiaryId);

    return this.prisma.supplierDebt.create({
      data: {
        id: generateId(ID_PREFIXES.LONGTERDEBT),
        ...dto,
        dueDate: new Date(dto.dueDate),
        status: DebtStatus.A_PAYER,
        subsidiaryId: user.subsidiaryId,
      },
    });
  }

  async findAllSupplierDebts(user: JwtUser) {
    this.validateSubsidiaryId(user.subsidiaryId);
    return this.prisma.supplierDebt.findMany({
      where: { subsidiaryId: user.subsidiaryId },
      orderBy: { dueDate: 'asc' },
    });
  }

  /**
   * Paiement d'une dette fournisseur — les deux opérations (mise à jour statut +
   * création transaction trésorerie) sont dans la MÊME transaction Prisma via
   * createExpenseTransactionWithTx, garantissant l'atomicité.
   */
  async paySupplierDebt(id: string, dto: PaySupplierDebtDto, user: JwtUser) {
    checkRole(
      user,
      [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR, UserRole.CAISSIER],
      'Permission denied to pay supplier debts.',
    );
    this.validateSubsidiaryId(user.subsidiaryId);

    const debt = await this.prisma.supplierDebt.findFirst({
      where: { id, subsidiaryId: user.subsidiaryId },
    });

    if (!debt) {
      throw new NotFoundException(`Supplier debt with ID "${id}" not found.`);
    }

    if (debt.status === DebtStatus.PAYER) {
      throw new BadRequestException('Cette dette est déjà payée.');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedDebt = await tx.supplierDebt.update({
        where: { id },
        data: { status: DebtStatus.PAYER },
      });

      // Utilise la méthode qui accepte le contexte tx pour rester dans la même transaction
      await this.treasuryService.createExpenseTransactionWithTx(
        tx,
        {
          transactionDate: new Date(dto.paymentDate).toISOString(),
          description: `Paiement facture fournisseur: ${debt.supplierName} - Facture N°${debt.invoiceId}`,
          financialTransactionType: TransactionType.DEPENSE,
          amount: debt.amount.toNumber(),
          treasuryAccountId: dto.treasuryAccountId,
          relatedDocumentId: debt.id,
        },
        user.subsidiaryId,
      );

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
    this.validateSubsidiaryId(user.subsidiaryId);

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

  async findAllLongTermDebts(user: JwtUser) {
    this.validateSubsidiaryId(user.subsidiaryId);
    return this.prisma.longTermDebt.findMany({
      where: { subsidiaryId: user.subsidiaryId },
      orderBy: { maturityDate: 'asc' },
    });
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
    this.validateSubsidiaryId(user.subsidiaryId);

    const debt = await this.prisma.longTermDebt.findFirst({
      where: { id, subsidiaryId: user.subsidiaryId },
    });

    if (!debt) {
      throw new NotFoundException(`Long-term debt with ID "${id}" not found.`);
    }

    return this.prisma.longTermDebt.update({ where: { id }, data: dto });
  }
}
