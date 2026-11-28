import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { AccountingOutboxService } from '../../accounting/outbox/accounting-outbox.service';
import { SystemAuditService } from '../../common/audit/system-audit.service';
import { generateId } from '../../common/utils/generate-id.util';
import { ID_PREFIXES } from '../../common/constants/id-prefixes.const';
import { CreateExternalTransactionDto } from './dto/create-external-transaction.dto';
import { UpdateExternalTransactionDto } from './dto/update-external-transaction.dto';
import { FindExternalTransactionsDto } from './dto/find-external-transactions.dto';
import { paginate } from '../../common/pagination/pagination';
import { endOfDateInput } from '../../common/utils/date-period.util';
import {
  AccountType,
  ExternalTransactionStatus,
  ExternalTransactionType,
  ExternalTransactionCategory,
  NotificationType,
  TransactionStatus,
  TransactionType,
  UserRole,
  Prisma,
} from '@prisma/client';

const EXTERNAL_INFLOW_TYPES: ExternalTransactionType[] = [
  ExternalTransactionType.INVESTMENT_RETURN,
  ExternalTransactionType.LOAN,
  ExternalTransactionType.PERSONAL_INCOME,
  ExternalTransactionType.TAX_REFUND,
  ExternalTransactionType.INSURANCE_PAYOUT,
  ExternalTransactionType.LEGAL_SETTLEMENT,
];

@Injectable()
export class ExternalTransactionService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    @Optional() private accountingOutbox?: AccountingOutboxService,
    @Optional() private systemAudit?: SystemAuditService,
  ) {}

  private async notifyAdminsAndFinancialDirectors(
    subsidiaryId: string,
    payload: {
      title: string;
      message: string;
      type: NotificationType;
      data?: Record<string, unknown>;
    },
  ): Promise<void> {
    await Promise.all([
      this.notificationsService.notifyUsersByRole(
        subsidiaryId,
        UserRole.ADMIN,
        payload,
      ),
      this.notificationsService.notifyUsersByRole(
        subsidiaryId,
        UserRole.FINANCIAL_DIRECTOR,
        payload,
      ),
    ]);
  }

  // Utilitaire pour formater les montants
  private formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  async create(createDto: CreateExternalTransactionDto) {
    try {
      if (createDto.impactsTreasury) {
        if (!createDto.treasuryAccountId) {
          throw new BadRequestException(
            'Sélectionnez le compte de trésorerie impacté (Coffre-fort ou Banque).',
          );
        }
        const account = await this.prisma.treasuryAccount.findFirst({
          where: {
            id: createDto.treasuryAccountId,
            subsidiaryId: createDto.subsidiaryId,
            accountType: { in: [AccountType.SAFE, AccountType.BANQUE] },
          },
        });
        if (!account) {
          throw new BadRequestException(
            'Compte de trésorerie (Coffre-fort ou Banque) introuvable dans cette filiale.',
          );
        }
      }

      const transaction = await this.prisma.externalFinancialTransaction.create(
        {
          data: {
            ...createDto,
            impactsTreasury: Boolean(createDto.impactsTreasury),
            treasuryAccountId: createDto.impactsTreasury
              ? createDto.treasuryAccountId
              : null,
            status: ExternalTransactionStatus.DRAFT,
            transactionDate: new Date(createDto.transactionDate),
          },
          include: {
            creator: {
              select: {
                id: true,
                userName: true,
                email: true,
              },
            },
            subsidiary: {
              select: {
                id: true,
                subsidiaryName: true,
              },
            },
          },
        },
      );

      await this.notifyAdminsAndFinancialDirectors(transaction.subsidiaryId, {
        title: 'Nouvelle Transaction Externe Créée',
        message: `${transaction.creator.userName || transaction.creator.email} a créé une nouvelle transaction externe : ${transaction.description} pour ${this.formatAmount(transaction.amount.toNumber())}`,
        type: NotificationType.EXTERNAL_TRANSACTION_CREATED,
        data: {
          transactionId: transaction.id,
          subsidiaryId: transaction.subsidiaryId,
          createdBy: transaction.createdBy,
          userName: transaction.creator.userName || transaction.creator.email,
          action: 'created',
        },
      });

      return transaction;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException(
            'Une transaction avec ces données existe déjà.',
          );
        }
        if (['P2003', 'P2004', 'P2025'].includes(error.code)) {
          throw new BadRequestException(
            'Les références de la transaction sont invalides.',
          );
        }
      }
      throw error;
    }
  }

  async findAll(query: FindExternalTransactionsDto) {
    const where: any = {
      subsidiaryId: query.subsidiaryId,
    };

    if (query.type) {
      where.externalTransactionType = query.type;
    }

    if (query.category) {
      where.externalTransactionCategory = query.category;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.startDate || query.endDate) {
      where.transactionDate = {};
      if (query.startDate) {
        where.transactionDate.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.transactionDate.lte = endOfDateInput(query.endDate);
      }
    }

    if (query.search) {
      where.OR = [
        { description: { contains: query.search, mode: 'insensitive' } },
        { referenceNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return paginate(
      this.prisma.externalFinancialTransaction,
      {
        where,
        orderBy: {
          transactionDate: 'desc',
        },
        include: {
          creator: {
            select: {
              id: true,
              userName: true,
              email: true,
            },
          },
          subsidiary: {
            select: {
              id: true,
              subsidiaryName: true,
            },
          },
        },
      },
      query,
    );
  }

  async findOne(id: string, subsidiaryId: string | undefined) {
    const transaction =
      await this.prisma.externalFinancialTransaction.findUnique({
        where: { id, subsidiaryId },
        include: {
          creator: {
            select: {
              id: true,
              userName: true,
              email: true,
            },
          },
          subsidiary: {
            select: {
              id: true,
              subsidiaryName: true,
            },
          },
        },
      });

    if (!transaction) {
      throw new NotFoundException(`Transaction avec l'ID ${id} non trouvée`);
    }

    return transaction;
  }

  private editableData(dto: UpdateExternalTransactionDto) {
    return {
      transactionDate: dto.transactionDate
        ? new Date(dto.transactionDate)
        : undefined,
      description: dto.description,
      amount: dto.amount,
      externalTransactionType: dto.externalTransactionType,
      externalTransactionCategory: dto.externalTransactionCategory,
      paymentMethod: dto.paymentMethod,
      referenceNumber: dto.referenceNumber,
      relatedDocumentUrl: dto.relatedDocumentUrl,
    };
  }

  async update(
    id: string,
    updateDto: UpdateExternalTransactionDto,
    subsidiaryId: string | undefined,
  ) {
    const existingTransaction = await this.findOne(id, subsidiaryId);

    // Empêcher la modification d'une transaction validée
    if (existingTransaction.status === ExternalTransactionStatus.VALIDATED) {
      throw new BadRequestException(
        'Impossible de modifier une transaction validée',
      );
    }

    const updatedTransaction =
      await this.prisma.externalFinancialTransaction.update({
        where: { id, subsidiaryId },
        data: this.editableData(updateDto),
        include: {
          creator: {
            select: {
              id: true,
              userName: true,
              email: true,
            },
          },
          subsidiary: {
            select: {
              id: true,
              subsidiaryName: true,
            },
          },
        },
      });

    await this.notifyAdminsAndFinancialDirectors(
      updatedTransaction.subsidiaryId,
      {
        title: 'Transaction Externe Modifiée',
        message: `${updatedTransaction.creator.userName || updatedTransaction.creator.email} a modifié la transaction externe : ${updatedTransaction.description} pour ${this.formatAmount(updatedTransaction.amount.toNumber())}`,
        type: NotificationType.EXTERNAL_TRANSACTION_VALIDATED,
        data: {
          transactionId: updatedTransaction.id,
          subsidiaryId: updatedTransaction.subsidiaryId,
          createdBy: updatedTransaction.createdBy,
          userName:
            updatedTransaction.creator.userName ||
            updatedTransaction.creator.email,
          action: 'updated',
        },
      },
    );

    return updatedTransaction;
  }

  async validate(
    id: string,
    subsidiaryId: string | undefined,
    validatorUserId: string,
  ) {
    const transaction = await this.findOne(id, subsidiaryId);

    if (transaction.status === ExternalTransactionStatus.VALIDATED) {
      throw new BadRequestException('Cette transaction est déjà validée');
    }

    if (transaction.status === ExternalTransactionStatus.CANCELLED) {
      throw new BadRequestException(
        'Impossible de valider une transaction annulée',
      );
    }

    // Vérifier si l'utilisateur qui valide est un directeur financier
    let validatorUser: {
      id: string;
      userName: string | null;
      email: string;
      userRole: UserRole;
    } | null = null;
    if (validatorUserId) {
      validatorUser = await this.prisma.user.findUnique({
        where: { id: validatorUserId },
        select: {
          id: true,
          userName: true,
          email: true,
          userRole: true,
        },
      });
    }

    const amount = new Prisma.Decimal(transaction.amount);
    const isInflow = EXTERNAL_INFLOW_TYPES.includes(
      transaction.externalTransactionType,
    );

    const validatedTransaction = await this.prisma.$transaction(async (tx) => {
      let financialTransactionId: string | null = null;

      if (transaction.impactsTreasury && transaction.treasuryAccountId) {
        const account = await tx.treasuryAccount.findFirst({
          where: {
            id: transaction.treasuryAccountId,
            subsidiaryId: transaction.subsidiaryId,
            accountType: { in: [AccountType.SAFE, AccountType.BANQUE] },
          },
        });
        if (!account) {
          throw new BadRequestException(
            'Le compte de trésorerie rattaché est introuvable dans cette filiale.',
          );
        }

        const subsidiary = await tx.subsidiary.findUnique({
          where: { id: transaction.subsidiaryId },
          select: { safeMakerCheckerThreshold: true },
        });
        const safeThreshold = Number(
          subsidiary?.safeMakerCheckerThreshold ?? 0,
        );
        const sameUserValidation =
          !!validatorUserId && validatorUserId === transaction.createdBy;
        const requiresSecondApprover =
          sameUserValidation &&
          (account.accountType === AccountType.BANQUE ||
            (account.accountType === AccountType.SAFE &&
              safeThreshold > 0 &&
              Number(amount) >= safeThreshold));

        if (requiresSecondApprover) {
          const pendingFinTx = await tx.financialTransaction.create({
            data: {
              id: generateId(ID_PREFIXES.TREASURY),
              description: `Opération externe (${transaction.externalTransactionType}) : ${transaction.description}`,
              amount,
              financialTransactionType: isInflow
                ? TransactionType.RECETTE
                : TransactionType.DEPENSE,
              treasuryAccountId: account.id,
              sourceAccountId: account.id,
              relatedDocumentId: transaction.id,
              reference: transaction.referenceNumber ?? transaction.id,
              subsidiaryId: transaction.subsidiaryId,
              transactionDate: transaction.transactionDate,
              status: TransactionStatus.EN_ATTENTE,
              createdByUserId: transaction.createdBy,
            },
          });
          financialTransactionId = pendingFinTx.id;
        } else {
          if (!isInflow && account.balance.comparedTo(amount) < 0) {
            throw new BadRequestException(
              `Solde insuffisant sur "${account.accountName}".`,
            );
          }
          const balanceBeforeSource = account.balance;
          const updatedAccount = await tx.treasuryAccount.update({
            where: { id: account.id },
            data: {
              balance: isInflow ? { increment: amount } : { decrement: amount },
            },
          });
          const finTx = await tx.financialTransaction.create({
            data: {
              id: generateId(ID_PREFIXES.TREASURY),
              description: `Opération externe (${transaction.externalTransactionType}) : ${transaction.description}`,
              amount,
              financialTransactionType: isInflow
                ? TransactionType.RECETTE
                : TransactionType.DEPENSE,
              treasuryAccountId: account.id,
              sourceAccountId: account.id,
              relatedDocumentId: transaction.id,
              reference: transaction.referenceNumber ?? transaction.id,
              subsidiaryId: transaction.subsidiaryId,
              transactionDate: transaction.transactionDate,
              status: TransactionStatus.VALIDE,
              createdByUserId: transaction.createdBy,
              approvedByUserId: validatorUserId || transaction.createdBy,
              approvedAt: new Date(),
              balanceBeforeSource,
              balanceAfterSource: updatedAccount.balance,
            },
          });
          financialTransactionId = finTx.id;

          if (this.accountingOutbox) {
            await this.accountingOutbox.enqueue(tx, {
              eventType: 'EXTERNAL_TRANSACTION',
              subsidiaryId: transaction.subsidiaryId,
              payload: {
                userId: validatorUserId || transaction.createdBy,
                operationDate: transaction.transactionDate.toISOString(),
                amount: Number(amount),
                description: transaction.description,
                sourceId: finTx.id,
                accountType: account.accountType,
                direction: isInflow ? 'INFLOW' : 'OUTFLOW',
              },
            });
          }
        }
      }

      return tx.externalFinancialTransaction.update({
        where: { id, subsidiaryId, status: transaction.status },
        data: {
          status: ExternalTransactionStatus.VALIDATED,
          validatedById: validatorUserId || null,
          validatedAt: new Date(),
          ...(financialTransactionId ? { financialTransactionId } : {}),
        },
        include: {
          creator: {
            select: {
              id: true,
              userName: true,
              email: true,
            },
          },
          subsidiary: {
            select: {
              id: true,
              subsidiaryName: true,
            },
          },
        },
      });
    });

    await this.systemAudit?.log({
      actorId: validatorUserId || validatedTransaction.createdBy,
      subsidiaryId: validatedTransaction.subsidiaryId,
      action: 'EXTERNAL_TRANSACTION_VALIDATED',
      entityType: 'ExternalFinancialTransaction',
      entityId: validatedTransaction.id,
      summary: `Validation opération externe (${validatedTransaction.externalTransactionType}) : ${Number(validatedTransaction.amount)} FCFA`,
      metadata: {
        impactsTreasury: validatedTransaction.impactsTreasury,
        financialTransactionId: validatedTransaction.financialTransactionId,
        amount: Number(validatedTransaction.amount),
      },
    });

    if (validatorUser && validatorUser.userRole === 'FINANCIAL_DIRECTOR') {
      // Un directeur financier a validé : notifier uniquement les administrateurs
      await this.notificationsService.notifyUsersByRole(
        validatedTransaction.subsidiaryId,
        UserRole.ADMIN,
        {
          title: 'Transaction Externe Validée par un Directeur Financier',
          message: `Le directeur financier ${validatorUser.userName || validatorUser.email} a validé la transaction externe : ${validatedTransaction.description} pour ${this.formatAmount(validatedTransaction.amount.toNumber())}`,
          type: NotificationType.EXTERNAL_TRANSACTION_VALIDATED,
          data: {
            transactionId: validatedTransaction.id,
            subsidiaryId: validatedTransaction.subsidiaryId,
            createdBy: validatedTransaction.createdBy,
            validatedBy: validatorUser.id,
            validatorName: validatorUser.userName || validatorUser.email,
            action: 'validated_by_financial_director',
          },
        },
      );
    } else {
      await this.notifyAdminsAndFinancialDirectors(
        validatedTransaction.subsidiaryId,
        {
          title: 'Transaction Externe Validée',
          message: `${validatedTransaction.creator.userName || validatedTransaction.creator.email} a validé la transaction externe : ${validatedTransaction.description} pour ${this.formatAmount(validatedTransaction.amount.toNumber())}`,
          type: NotificationType.EXTERNAL_TRANSACTION_VALIDATED,
          data: {
            transactionId: validatedTransaction.id,
            subsidiaryId: validatedTransaction.subsidiaryId,
            createdBy: validatedTransaction.createdBy,
            userName:
              validatedTransaction.creator.userName ||
              validatedTransaction.creator.email,
            action: 'validated',
          },
        },
      );
    }

    return validatedTransaction;
  }

  async cancel(id: string, subsidiaryId: string | undefined) {
    const transaction = await this.findOne(id, subsidiaryId);

    if (transaction.status === ExternalTransactionStatus.CANCELLED) {
      throw new BadRequestException('Cette transaction est déjà annulée');
    }

    const cancelledTransaction =
      await this.prisma.externalFinancialTransaction.update({
        where: { id, subsidiaryId, status: transaction.status },
        data: {
          status: ExternalTransactionStatus.CANCELLED,
        },
        include: {
          creator: {
            select: {
              id: true,
              userName: true,
              email: true,
            },
          },
          subsidiary: {
            select: {
              id: true,
              subsidiaryName: true,
            },
          },
        },
      });

    await this.notifyAdminsAndFinancialDirectors(
      cancelledTransaction.subsidiaryId,
      {
        title: 'Transaction Externe Annulée',
        message: `${cancelledTransaction.creator.userName || cancelledTransaction.creator.email} a annulé la transaction externe : ${cancelledTransaction.description} pour ${this.formatAmount(cancelledTransaction.amount.toNumber())}`,
        type: NotificationType.EXTERNAL_TRANSACTION_CANCELLED,
        data: {
          transactionId: cancelledTransaction.id,
          subsidiaryId: cancelledTransaction.subsidiaryId,
          createdBy: cancelledTransaction.createdBy,
          userName:
            cancelledTransaction.creator.userName ||
            cancelledTransaction.creator.email,
          action: 'cancelled',
        },
      },
    );

    return cancelledTransaction;
  }

  async remove(id: string, subsidiaryId: string | undefined) {
    const transaction = await this.findOne(id, subsidiaryId);

    if (transaction.status === ExternalTransactionStatus.VALIDATED) {
      throw new BadRequestException(
        'Impossible de supprimer une transaction validée',
      );
    }

    // Notifications désactivées - suppression silencieuse

    await this.prisma.externalFinancialTransaction.delete({
      where: { id, subsidiaryId },
    });

    return { message: 'Transaction supprimée avec succès' };
  }

  // Fonctions spéciales pour les administrateurs et directeurs financiers
  async adminUpdate(
    id: string,
    updateDto: UpdateExternalTransactionDto,
    subsidiaryId: string,
  ) {
    await this.findOne(id, subsidiaryId);

    const updatedTransaction =
      await this.prisma.externalFinancialTransaction.update({
        where: { id, subsidiaryId },
        data: this.editableData(updateDto),
        include: {
          creator: {
            select: {
              id: true,
              userName: true,
              email: true,
            },
          },
          subsidiary: {
            select: {
              id: true,
              subsidiaryName: true,
            },
          },
        },
      });

    // Notifications désactivées

    return updatedTransaction;
  }

  async adminRemove(id: string, subsidiaryId: string) {
    const transaction = await this.findOne(id, subsidiaryId);
    if (transaction.status === ExternalTransactionStatus.VALIDATED) {
      throw new BadRequestException(
        'Une opération externe validée ne peut pas être supprimée — annulez ou contre-passez l’écriture.',
      );
    }

    await this.prisma.externalFinancialTransaction.delete({
      where: { id, subsidiaryId },
    });

    return {
      message: 'Transaction brouillon supprimée avec succès',
    };
  }

  async getStatistics(subsidiaryId: string) {
    const [
      totalTransactions,
      totalAmount,
      transactionsByType,
      transactionsByCategory,
      transactionsByStatus,
      recentTransactions,
    ] = await Promise.all([
      this.prisma.externalFinancialTransaction.count({
        where: { subsidiaryId },
      }),
      this.prisma.externalFinancialTransaction.aggregate({
        where: { subsidiaryId },
        _sum: { amount: true },
      }),
      this.prisma.externalFinancialTransaction.groupBy({
        by: ['externalTransactionType'],
        where: { subsidiaryId },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.externalFinancialTransaction.groupBy({
        by: ['externalTransactionCategory'],
        where: { subsidiaryId },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.externalFinancialTransaction.groupBy({
        by: ['status'],
        where: { subsidiaryId },
        _count: true,
      }),
      this.prisma.externalFinancialTransaction.findMany({
        where: { subsidiaryId },
        orderBy: { transactionDate: 'desc' },
        take: 5,
        select: {
          id: true,
          description: true,
          amount: true,
          transactionDate: true,
          externalTransactionType: true,
          status: true,
        },
      }),
    ]);

    return {
      totalTransactions,
      totalAmount: totalAmount._sum.amount || 0,
      transactionsByType: transactionsByType.map((item) => ({
        type: item.externalTransactionType,
        count: item._count,
        amount: item._sum.amount || 0,
      })),
      transactionsByCategory: transactionsByCategory.map((item) => ({
        category: item.externalTransactionCategory,
        count: item._count,
        amount: item._sum.amount || 0,
      })),
      transactionsByStatus: transactionsByStatus.map((item) => ({
        status: item.status,
        count: item._count,
      })),
      recentTransactions,
    };
  }
}
