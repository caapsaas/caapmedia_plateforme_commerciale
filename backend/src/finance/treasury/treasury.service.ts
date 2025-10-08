import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { User, UserRole, TransactionType, Prisma, TransactionStatus } from '@prisma/client';
import { CreateTreasuryAccountDto } from './dto/create-treasury-account.dto';
import { CreateFinancialTransactionDto } from './dto/create-financial-transaction.dto'; 
import { UpdateFinancialTransactionDto } from './dto/update-financial-transaction.dto';

@Injectable()
export class TreasuryService {
  constructor(private prisma: PrismaService) {}

  // ================================================================= //
  //                       TREASURY ACCOUNTS                           //
  // ================================================================= //

  async createAccount(dto: CreateTreasuryAccountDto, user: User) {
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR];
    // Le `user` vient du token JWT, la propriété est `role`, pas `userRole`.
    const userRole = (user as any).role || user.userRole;
    if (!allowedRoles.includes(userRole)) {
      throw new ForbiddenException('Permission denied to create treasury accounts.');
    }

    return this.prisma.treasuryAccount.create({
      data: {
        accountName: dto.accountName,
        balance: new Prisma.Decimal(dto.initialBalance),
        currency: dto.currency,
        subsidiaryId: user.subsidiaryId,
      },
    });
  }

  async findAllAccounts(user: User) {
    return this.prisma.treasuryAccount.findMany({
      where: { subsidiaryId: user.subsidiaryId },
      orderBy: { accountName: 'asc' },
    });
  }

  // ================================================================= //
  //                     FINANCIAL TRANSACTIONS                        //
  // ================================================================= //

  async createTransaction(dto: CreateFinancialTransactionDto, user: User) {
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR, UserRole.CAISSIER];
    // Le `user` vient du token JWT, la propriété est `role`, pas `userRole`.
    const userRole = (user as any).role || user.userRole;
    if (!allowedRoles.includes(userRole)) {
      throw new ForbiddenException('Permission denied to create transactions.');
    }

    const { treasuryAccountId, amount, financialTransactionType, transactionDate } = dto;

    const account = await this.prisma.treasuryAccount.findFirst({
      where: { id: treasuryAccountId, subsidiaryId: user.subsidiaryId },
    });

    if (!account) {
      throw new NotFoundException(`Treasury account with ID "${treasuryAccountId}" not found.`);
    }

    // Calculer le nouveau solde
    const newBalance =
      financialTransactionType === TransactionType.RECETTE
        ? account.balance.plus(amount)
        : account.balance.minus(amount);

    // Utiliser une transaction Prisma pour garantir l'atomicité
    return this.prisma.$transaction(async (tx) => {
      // 1. Mettre à jour le solde du compte
      await tx.treasuryAccount.update({
        where: { id: treasuryAccountId },
        data: { balance: newBalance },
      });

      // 2. Créer l'enregistrement de la transaction
      const transaction = await tx.financialTransaction.create({
        data: {
          description: dto.description,
          relatedDocumentId: dto.relatedDocumentId,
          amount,
          financialTransactionType,
          status: dto.status ?? TransactionStatus.EN_ATTENTE,
          treasuryAccountId,
          subsidiaryId: user.subsidiaryId,
          transactionDate: new Date(transactionDate),
        },
      });

      return transaction;
    });
  }

  async findAllTransactions(user: User) {
    return this.prisma.financialTransaction.findMany({
      where: { subsidiaryId: user.subsidiaryId },
      orderBy: { transactionDate: 'desc' },
      include: { treasuryAccount: { select: { accountName: true } } },
    });
  }

  async updateTransactionStatus(id: string, dto: UpdateFinancialTransactionDto, user: User) {
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR];
    // Le `user` vient du token JWT, la propriété est `role`, pas `userRole`.
    const userRole = (user as any).role || user.userRole;
    if (!allowedRoles.includes(userRole)) {
      throw new ForbiddenException('Permission denied to update transaction status.');
    }

    const transaction = await this.prisma.financialTransaction.findFirst({
      where: { id, subsidiaryId: user.subsidiaryId },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID "${id}" not found.`);
    }
    
    if (transaction.status === dto.status) {
        return transaction; // Pas de changement
    }

    // Logique métier : on ne peut pas annuler une transaction qui a déjà affecté un solde.
    // Pour cela, il faudrait une transaction de contre-passation.
    // Ici, nous permettons seulement de passer de "EN_ATTENTE" à "VALIDE".
    if (transaction.status !== 'EN_ATTENTE' || dto.status !== 'VALIDE') {
        throw new BadRequestException('Invalid status transition for transaction.');
    }

    return this.prisma.financialTransaction.update({
      where: { id },
      data: { status: dto.status },
    });
  }
}
