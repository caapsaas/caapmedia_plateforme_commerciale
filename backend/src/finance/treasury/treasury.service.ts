import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { User, UserRole, TransactionType, Prisma, AccountType } from '@prisma/client';
import { CreateTreasuryAccountDto } from './dto/create-treasury-account.dto';
import { CreateFinancialTransactionDto } from './dto/create-financial-transaction.dto'; 
import { UpdateTreasuryAccountDto } from './dto/update-treasury-account.dto';

@Injectable()
export class TreasuryService {
  constructor(private readonly prisma: PrismaService) {}

  
  private checkPermissions(user: User, allowedRoles: UserRole[], message: string) {
    const userRole = (user as any).role || user.userRole;
    if (!allowedRoles.includes(userRole)) {
      throw new ForbiddenException(message);
    }
  }

  // ================================================================= //
  //                       TREASURY ACCOUNTS                           //
  // ================================================================= //

  async createAccount(dto: CreateTreasuryAccountDto, user: User) {
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR];
    // Le `user` vient du token JWT, la propriété est `role`, pas `userRole`.
    this.checkPermissions(user, allowedRoles, 'Permission denied to create treasury accounts.');

    // Vérifier s'il existe déjà un compte de préfinancement pour cette filiale
    if (dto.accountType === AccountType.COMPTE_PREFINANCEMENT) {
      const existingPrefinancementAccount = await this.prisma.treasuryAccount.findFirst({
        where: {
          subsidiaryId: user.subsidiaryId,
          accountType: AccountType.COMPTE_PREFINANCEMENT,
        },
      });

      if (existingPrefinancementAccount) {
        throw new BadRequestException(
          `Un compte de préfinancement existe déjà pour cette filiale (${existingPrefinancementAccount.accountName}). Une filiale ne peut avoir qu'un seul compte de préfinancement.`
        );
      }
    }

    return this.prisma.treasuryAccount.create({
      data: {
        accountName: dto.accountName,
        balance: new Prisma.Decimal(dto.initialBalance),
        currency: dto.currency,
        accountType: dto.accountType,
        subsidiaryId: user.subsidiaryId,
      },
    });
  }

  async findAllAccounts(user: User, subsidiaryId?: string) {
    const userRole = (user as any).role || user.userRole;
    const targetSubsidiaryId = (userRole === UserRole.ADMIN && subsidiaryId) ? subsidiaryId : user.subsidiaryId;

    // Récupérer tous les comptes de trésorerie avec leur solde actuel
    // Le solde est déjà maintenu à jour par les mises à jour atomiques lors des transactions
    const accounts = await this.prisma.treasuryAccount.findMany({
      where: { subsidiaryId: targetSubsidiaryId },
      orderBy: { accountName: 'asc' },
    });

    // Retourner les comptes avec leur solde actuel (pas de recalcul nécessaire)
    return accounts.map(account => ({
      ...account,
      balance: Number(account.balance), // Convertir Decimal en number pour le frontend
    }));
  }

  async findOneAccount(id: string, user: User) {
    const account = await this.prisma.treasuryAccount.findFirst({
      where: {
        id,
        subsidiaryId: user.subsidiaryId,
      },
    });

    if (!account) {
      throw new NotFoundException(`Treasury account with ID "${id}" not found.`);
    }

    // Retourner le compte avec son solde actuel (déjà maintenu à jour par les transactions atomiques)
    return {
      ...account,
      balance: Number(account.balance), // Convertir Decimal en number pour le frontend
    };
  }

  async updateAccount(id: string, dto: UpdateTreasuryAccountDto, user: User) {
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR];
    this.checkPermissions(user, allowedRoles, 'Permission denied to update treasury accounts.');

    await this.findOneAccount(id, user); // Check for existence and permissions

    return this.prisma.treasuryAccount.update({
      where: { id },
      data: dto,
    });
  }

  async deleteAccount(id: string, user: User) {
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR];
    this.checkPermissions(user, allowedRoles, 'Permission denied to delete treasury accounts.');

    const account = await this.prisma.treasuryAccount.findFirst({
      where: { id, subsidiaryId: user.subsidiaryId },
      include: { _count: { select: { financialTransactions: true } } },
    });

    if (!account) {
      throw new NotFoundException(`Treasury account with ID "${id}" not found.`);
    }

    // Autoriser la suppression des comptes avec solde non nul
    // La confirmation est gérée côté frontend

    if (account._count.financialTransactions > 0) {
      throw new BadRequestException('Cannot delete an account with existing transactions.');
    }

    return this.prisma.treasuryAccount.delete({
      where: { id },
    });
  }

  // ================================================================= //
  //              GESTION DES COMPTES DE PRÉFINANCEMENT               //
  // ================================================================= //

  async findPrefinancementAccount(subsidiaryId: string) {
    return this.prisma.treasuryAccount.findFirst({
      where: {
        subsidiaryId,
        accountType: AccountType.COMPTE_PREFINANCEMENT,
      },
    });
  }

  async getOrCreatePrefinancementAccount(subsidiaryId: string, user: User) {
    // D'abord, essayer de trouver un compte existant
    const existingAccount = await this.findPrefinancementAccount(subsidiaryId);
    
    if (existingAccount) {
      return existingAccount;
    }

    // Si aucun compte n'existe, en créer un automatiquement
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR];
    this.checkPermissions(user, allowedRoles, 'Permission denied to create prefinancement accounts.');

    return this.prisma.treasuryAccount.create({
      data: {
        accountName: 'Compte de Préfinancement',
        balance: new Prisma.Decimal(0),
        currency: 'XOF',
        accountType: AccountType.COMPTE_PREFINANCEMENT,
        subsidiaryId,
      },
    });
  }


  // ================================================================= //
  //                     FINANCIAL TRANSACTIONS                        //
  // ================================================================= //

  async createIncomeTransaction(dto: CreateFinancialTransactionDto, user: User) {
    // Forcer le type pour s'assurer que c'est bien une recette
    return this.createTransaction(dto, user, TransactionType.RECETTE);
  }

  async createExpenseTransaction(dto: CreateFinancialTransactionDto, user: User) {
    // Forcer le type pour s'assurer que c'est bien une dépense
    return this.createTransaction(dto, user, TransactionType.DEPENSE);
  }

  /**
   * Méthode interne pour la création de toute transaction financière.
   * Gère la mise à jour du solde et l'enregistrement de la transaction.
   * @param dto Les données de la transaction
   * @param user L'utilisateur effectuant l'action
   * @param financialTransactionType Le type de transaction (RECETTE ou DEPENSE)
   */
  private async createTransaction(dto: CreateFinancialTransactionDto, user: User, financialTransactionType: TransactionType) {
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR, UserRole.CAISSIER];
    this.checkPermissions(user, allowedRoles, 'Permission denied to create transactions.');

    const { treasuryAccountId, amount, transactionDate } = dto;
    
    // Convertir le montant en Prisma.Decimal
    const decimalAmount = new Prisma.Decimal(amount);
    
    const account = await this.prisma.treasuryAccount.findFirst({
      where: { id: treasuryAccountId, subsidiaryId: user.subsidiaryId },
    });

    if (!account) {
      throw new NotFoundException(`Treasury account with ID "${treasuryAccountId}" not found.`);
    }

    // Vérification du solde pour les dépenses
    if (financialTransactionType === TransactionType.DEPENSE) {
      if (account.balance.comparedTo(decimalAmount) < 0) {
        throw new BadRequestException(`Solde insuffisant sur le compte "${account.accountName}". Solde actuel: ${account.balance}, Montant de la dépense: ${decimalAmount}.`);
      }
    }

    // Utiliser increment/decrement pour la mise à jour atomique du solde
    const balanceUpdateOperation =
      financialTransactionType === TransactionType.RECETTE 
        ? { increment: decimalAmount } 
        : { decrement: decimalAmount };

    // Utiliser une transaction Prisma pour garantir l'atomicité
    return this.prisma.$transaction(async (tx) => {
      // 1. Mettre à jour le solde du compte
      await tx.treasuryAccount.update({
        where: { id: treasuryAccountId },
        data: { balance: balanceUpdateOperation },
      });

      // 2. Créer l'enregistrement de la transaction
      const transaction = await tx.financialTransaction.create({
        data: {
          description: dto.description,
          relatedDocumentId: dto.relatedDocumentId,
          amount: decimalAmount,
          financialTransactionType,
          treasuryAccountId,
          subsidiaryId: user.subsidiaryId,
          transactionDate: new Date(transactionDate),
          providerName: dto.providerName,
          providerPhone: dto.providerPhone,
        },
      });

      return transaction;
    });
  }

  async findAllTransactions(user: User, subsidiaryId?: string) {
    const allowedRoles = [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR, UserRole.CAISSIER];
    this.checkPermissions(user, allowedRoles, 'Permission denied to view transactions.');

    const userRole = (user as any).role || user.userRole;
    const targetSubsidiaryId = (userRole === UserRole.ADMIN && subsidiaryId) ? subsidiaryId : user.subsidiaryId;

    return this.prisma.financialTransaction.findMany({
      where: { subsidiaryId: targetSubsidiaryId },
      orderBy: { transactionDate: 'desc' },
      include: { treasuryAccount: { select: { accountName: true } } },
    });
  }

  
  async deleteTransaction(id: string, user: User) {
    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR];
    this.checkPermissions(user, allowedRoles, 'Permission denied to delete transactions.');

    const transaction = await this.prisma.financialTransaction.findFirst({
      where: { id, subsidiaryId: user.subsidiaryId },
      include: { treasuryAccount: true },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID "${id}" not found.`);
    }

    // Utiliser une transaction Prisma pour garantir l'atomicité
    return this.prisma.$transaction(async (tx) => {
      // 1. Ajuster le solde du compte en sens inverse
      const balanceUpdateOperation =
        transaction.financialTransactionType === TransactionType.RECETTE 
          ? { decrement: transaction.amount } 
          : { increment: transaction.amount };

      await tx.treasuryAccount.update({
        where: { id: transaction.treasuryAccountId },
        data: { balance: balanceUpdateOperation },
      });

      // 2. Supprimer la transaction
      return tx.financialTransaction.delete({
        where: { id },
      });
    });
  }
}
