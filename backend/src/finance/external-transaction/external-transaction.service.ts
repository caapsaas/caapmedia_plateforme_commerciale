import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { CreateExternalTransactionDto } from './dto/create-external-transaction.dto';
import { UpdateExternalTransactionDto } from './dto/update-external-transaction.dto';
import { ExternalTransactionStatus } from '@prisma/client';

@Injectable()
export class ExternalTransactionService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateExternalTransactionDto) {
    try {
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

      return transaction;
    } catch (error) {
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

    return updatedTransaction;
  }

  async validate(id: string) {
    const transaction = await this.findOne(id);

    if (transaction.status === ExternalTransactionStatus.VALIDATED) {
      throw new BadRequestException('Cette transaction est déjà validée');
    }

    if (transaction.status === ExternalTransactionStatus.CANCELLED) {
      throw new BadRequestException('Impossible de valider une transaction annulée');
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

    return cancelledTransaction;
  }

  async remove(id: string) {
    const transaction = await this.findOne(id);

    if (transaction.status === ExternalTransactionStatus.VALIDATED) {
      throw new BadRequestException('Impossible de supprimer une transaction validée');
    }

    await this.prisma.externalFinancialTransaction.delete({
      where: { id },
    });

    return { message: 'Transaction supprimée avec succès' };
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
