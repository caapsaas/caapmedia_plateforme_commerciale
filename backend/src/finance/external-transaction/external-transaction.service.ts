import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { CreateExternalTransactionDto } from './dto/create-external-transaction.dto';
import { UpdateExternalTransactionDto } from './dto/update-external-transaction.dto';
import { ExternalTransactionStatus, NotificationType, UserRole } from '@prisma/client';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class ExternalTransactionService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) {}

  // Utilitaire pour formater les montants
  private formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  async create(createDto: CreateExternalTransactionDto) {
    try {
      console.log('Creating external transaction with DTO:', JSON.stringify(createDto, null, 2));
      
      const transaction = await this.prisma.externalFinancialTransaction.create({
        data: {
          ...createDto,
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
      });

      // Envoyer une notification aux admins et directeurs financiers
      await this.notificationsService.sendAdminNotification({
        type: 'EXTERNAL_TRANSACTION_CREATED',
        title: 'Nouvelle Transaction Externe Créée',
        message: `${transaction.creator.userName || transaction.creator.email} a créé une nouvelle transaction externe : ${transaction.description} pour ${this.formatAmount(transaction.amount.toNumber())}`,
        data: {
          transactionId: transaction.id,
          subsidiaryId: transaction.subsidiaryId,
          createdBy: transaction.createdBy,
          userName: transaction.creator.userName || transaction.creator.email,
          action: 'created'
        }
      });

      return transaction;
    } catch (error) {
      console.error('Error creating external transaction:', error);
      if (error.code === 'P2002') {
        throw new BadRequestException('Erreur de contrainte unique: une transaction avec ces données existe déjà.');
      }
      if (error.code === 'P2025') {
        throw new BadRequestException('Erreur: enregistrement non trouvé. Vérifiez que l\'utilisateur et la filiale existent.');
      }
      throw new BadRequestException(`Erreur lors de la création de la transaction: ${error.message}`);
    }
  }

  async findAll(subsidiaryId: string, filters?: {
    type?: string;
    category?: string;
    status?: ExternalTransactionStatus;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) {
    const where: any = {
      subsidiaryId,
    };

    if (filters?.type) {
      where.externalTransactionType = filters.type;
    }

    if (filters?.category) {
      where.externalTransactionCategory = filters.category;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.transactionDate = {};
      if (filters.startDate) {
        where.transactionDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.transactionDate.lte = new Date(filters.endDate);
      }
    }

    if (filters?.search) {
      where.OR = [
        { description: { contains: filters.search, mode: 'insensitive' } },
        { referenceNumber: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const transactions = await this.prisma.externalFinancialTransaction.findMany({
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
    });

    return transactions;
  }

  async findOne(id: string) {
    const transaction = await this.prisma.externalFinancialTransaction.findUnique({
      where: { id },
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

  async update(id: string, updateDto: UpdateExternalTransactionDto) {
    const existingTransaction = await this.findOne(id);

    // Empêcher la modification d'une transaction validée
    if (existingTransaction.status === ExternalTransactionStatus.VALIDATED) {
      throw new BadRequestException('Impossible de modifier une transaction validée');
    }

    // Remove fields that shouldn't be updated
    const { createdBy, subsidiaryId, ...validUpdateData } = updateDto as any;
    
    const updateData: any = { ...validUpdateData };
    
    if (updateDto.transactionDate) {
      updateData.transactionDate = new Date(updateDto.transactionDate);
    }

    const updatedTransaction = await this.prisma.externalFinancialTransaction.update({
      where: { id },
      data: updateData,
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

    // Envoyer une notification aux admins et directeurs financiers
    await this.notificationsService.sendAdminNotification({
      type: 'EXTERNAL_TRANSACTION_VALIDATED',
      title: 'Transaction Externe Modifiée',
      message: `${updatedTransaction.creator.userName || updatedTransaction.creator.email} a modifié la transaction externe : ${updatedTransaction.description} pour ${this.formatAmount(updatedTransaction.amount.toNumber())}`,
      data: {
        transactionId: updatedTransaction.id,
        subsidiaryId: updatedTransaction.subsidiaryId,
        createdBy: updatedTransaction.createdBy,
        userName: updatedTransaction.creator.userName || updatedTransaction.creator.email,
        action: 'updated'
      }
    });

    return updatedTransaction;
  }

  async validate(id: string, validatorUserId?: string) {
    const transaction = await this.findOne(id);

    if (transaction.status === ExternalTransactionStatus.VALIDATED) {
      throw new BadRequestException('Cette transaction est déjà validée');
    }

    if (transaction.status === ExternalTransactionStatus.CANCELLED) {
      throw new BadRequestException('Impossible de valider une transaction annulée');
    }

    // Vérifier si l'utilisateur qui valide est un directeur financier
    let validatorUser: { id: string; userName: string | null; email: string; userRole: UserRole } | null = null;
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

    const validatedTransaction = await this.prisma.externalFinancialTransaction.update({
      where: { id },
      data: {
        status: ExternalTransactionStatus.VALIDATED,
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

    // Si un directeur financier a validé la transaction, notifier uniquement les administrateurs
    if (validatorUser && validatorUser.userRole === 'FINANCIAL_DIRECTOR') {
      await this.notificationsService.notifyAdminsOnly({
        type: NotificationType.EXTERNAL_TRANSACTION_VALIDATED,
        title: 'Transaction Externe Validée par un Directeur Financier',
        message: `Le directeur financier ${validatorUser.userName || validatorUser.email} a validé la transaction externe : ${validatedTransaction.description} pour ${this.formatAmount(validatedTransaction.amount.toNumber())}`,
        data: {
          transactionId: validatedTransaction.id,
          subsidiaryId: validatedTransaction.subsidiaryId,
          createdBy: validatedTransaction.createdBy,
          validatedBy: validatorUser.id,
          validatorName: validatorUser.userName || validatorUser.email,
          action: 'validated_by_financial_director'
        }
      });
    } else {
      // Pour les autres cas, notifier tous les admins et directeurs financiers
      await this.notificationsService.sendAdminNotification({
        type: NotificationType.EXTERNAL_TRANSACTION_VALIDATED,
        title: 'Transaction Externe Validée',
        message: `${validatedTransaction.creator.userName || validatedTransaction.creator.email} a validé la transaction externe : ${validatedTransaction.description} pour ${this.formatAmount(validatedTransaction.amount.toNumber())}`,
        data: {
          transactionId: validatedTransaction.id,
          subsidiaryId: validatedTransaction.subsidiaryId,
          createdBy: validatedTransaction.createdBy,
          userName: validatedTransaction.creator.userName || validatedTransaction.creator.email,
          action: 'validated'
        }
      });
    }

    return validatedTransaction;
  }

  async cancel(id: string) {
    const transaction = await this.findOne(id);

    if (transaction.status === ExternalTransactionStatus.CANCELLED) {
      throw new BadRequestException('Cette transaction est déjà annulée');
    }

    const cancelledTransaction = await this.prisma.externalFinancialTransaction.update({
      where: { id },
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

    // Envoyer une notification aux admins et directeurs financiers
    await this.notificationsService.sendAdminNotification({
      type: NotificationType.EXTERNAL_TRANSACTION_CANCELLED,
      title: 'Transaction Externe Annulée',
      message: `${cancelledTransaction.creator.userName || cancelledTransaction.creator.email} a annulé la transaction externe : ${cancelledTransaction.description} pour ${this.formatAmount(cancelledTransaction.amount.toNumber())}`,
      data: {
        transactionId: cancelledTransaction.id,
        subsidiaryId: cancelledTransaction.subsidiaryId,
        createdBy: cancelledTransaction.createdBy,
        userName: cancelledTransaction.creator.userName || cancelledTransaction.creator.email,
        action: 'cancelled'
      }
    });

    return cancelledTransaction;
  }

  async remove(id: string) {
    const transaction = await this.findOne(id);

    if (transaction.status === ExternalTransactionStatus.VALIDATED) {
      throw new BadRequestException('Impossible de supprimer une transaction validée');
    }

    // Envoyer une notification avant la suppression
    await this.notificationsService.sendAdminNotification({
      type: NotificationType.EXTERNAL_TRANSACTION_CANCELLED,
      title: 'Transaction Externe Supprimée',
      message: `${transaction.creator.userName || transaction.creator.email} a supprimé la transaction externe : ${transaction.description} pour ${this.formatAmount(transaction.amount.toNumber())}`,
      data: {
        transactionId: transaction.id,
        subsidiaryId: transaction.subsidiaryId,
        createdBy: transaction.createdBy,
        userName: transaction.creator.userName || transaction.creator.email,
        action: 'deleted'
      }
    });

    await this.prisma.externalFinancialTransaction.delete({
      where: { id },
    });

    return { message: 'Transaction supprimée avec succès' };
  }

  // Fonctions spéciales pour les administrateurs et directeurs financiers
  async adminUpdate(id: string, updateDto: UpdateExternalTransactionDto, adminUserId: string) {
    const existingTransaction = await this.findOne(id);

    // Vérifier que l'utilisateur est un administrateur ou un directeur financier
    const adminUser = await this.prisma.user.findUnique({
      where: { id: adminUserId },
      select: { userRole: true }
    });

    if (!adminUser || !['ADMIN', 'FINANCIAL_DIRECTOR'].includes(adminUser.userRole)) {
      throw new BadRequestException('Accès refusé: réservé aux administrateurs et directeurs financiers');
    }

    const updateData: any = { ...updateDto };
    
    if (updateDto.transactionDate) {
      updateData.transactionDate = new Date(updateDto.transactionDate);
    }

    const updatedTransaction = await this.prisma.externalFinancialTransaction.update({
      where: { id },
      data: updateData,
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

    // Envoyer une notification spéciale pour modification par admin
    await this.notificationsService.sendAdminNotification({
      type: 'EXTERNAL_TRANSACTION_VALIDATED',
      title: 'Transaction Externe Modifiée par Admin',
      message: `${adminUser.userRole === 'ADMIN' ? 'L\'administrateur' : 'Le directeur financier'} ${adminUser.userRole} a modifié la transaction validée : ${updatedTransaction.description} pour ${this.formatAmount(updatedTransaction.amount.toNumber())}`,
      data: {
        transactionId: updatedTransaction.id,
        subsidiaryId: updatedTransaction.subsidiaryId,
        createdBy: updatedTransaction.createdBy,
        modifiedBy: adminUserId,
        action: 'admin_modified_validated'
      }
    });

    return updatedTransaction;
  }

  async adminRemove(id: string, adminUserId: string) {
    const transaction = await this.findOne(id);

    // Vérifier que l'utilisateur est un administrateur ou un directeur financier
    const adminUser = await this.prisma.user.findUnique({
      where: { id: adminUserId },
      select: { userRole: true }
    });

    if (!adminUser || !['ADMIN', 'FINANCIAL_DIRECTOR'].includes(adminUser.userRole)) {
      throw new BadRequestException('Accès refusé: réservé aux administrateurs et directeurs financiers');
    }

    // Envoyer une notification avant la suppression
    await this.notificationsService.sendAdminNotification({
      type: NotificationType.EXTERNAL_TRANSACTION_CANCELLED,
      title: 'Transaction Validée Supprimée par Admin',
      message: `${adminUser.userRole === 'ADMIN' ? 'L\'administrateur' : 'Le directeur financier'} a supprimé la transaction validée : ${transaction.description} pour ${this.formatAmount(transaction.amount.toNumber())}`,
      data: {
        transactionId: transaction.id,
        subsidiaryId: transaction.subsidiaryId,
        createdBy: transaction.createdBy,
        deletedBy: adminUserId,
        action: 'admin_deleted_validated'
      }
    });

    await this.prisma.externalFinancialTransaction.delete({
      where: { id },
    });

    return { message: 'Transaction validée supprimée avec succès par l\'administrateur' };
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
      transactionsByType: transactionsByType.map(item => ({
        type: item.externalTransactionType,
        count: item._count,
        amount: item._sum.amount || 0,
      })),
      transactionsByCategory: transactionsByCategory.map(item => ({
        category: item.externalTransactionCategory,
        count: item._count,
        amount: item._sum.amount || 0,
      })),
      transactionsByStatus: transactionsByStatus.map(item => ({
        status: item.status,
        count: item._count,
      })),
      recentTransactions,
    };
  }
}
