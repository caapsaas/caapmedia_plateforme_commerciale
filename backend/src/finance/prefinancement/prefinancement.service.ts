import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { PrefinancementTransactionType, PrefinancementCategory, PrefinancementStatus } from '@prisma/client';
import { TreasuryService } from '../treasury/treasury.service';

@Injectable()
export class PrefinancementService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly treasuryService: TreasuryService
    ) {}

    // --- Account Methods ---
    async createAccount(createDto: {
        accountName: string;
        initialBalance?: number;
        subsidiaryId: string;
    }) {
        return this.prisma.prefinancementAccount.create({
            data: {
                accountName: createDto.accountName,
                balance: createDto.initialBalance || 0,
                subsidiaryId: createDto.subsidiaryId,
            },
        });
    }

    async findAccount(subsidiaryId?: string) {
        // Récupérer le compte de trésorerie de type préfinancement
        if (!subsidiaryId) {
            return null;
        }
        
        const treasuryAccount = await this.treasuryService.findPrefinancementAccount(subsidiaryId);
        
        if (!treasuryAccount) {
            return null;
        }

        // Retourner les données au format attendu par le frontend
        return {
            id: treasuryAccount.id,
            accountName: treasuryAccount.accountName,
            balance: Number(treasuryAccount.balance),
            currency: treasuryAccount.currency,
            lastUpdated: new Date().toISOString(), // Utiliser la date actuelle car updatedAt n'existe pas sur TreasuryAccount
            subsidiaryId: treasuryAccount.subsidiaryId,
        };
    }

    async updateAccount(accountId: string, updateDto: {
        accountName?: string;
        initialBalance?: number;
        subsidiaryId?: string;
    }) {
        const updateData: any = { ...updateDto };
        if (updateDto.initialBalance !== undefined) {
            updateData.balance = updateDto.initialBalance;
            delete updateData.initialBalance;
        }
        
        return this.prisma.prefinancementAccount.update({
            where: { id: accountId },
            data: updateData,
        });
    }

    // --- Transaction Methods ---
    async createTransaction(createDto: {
        date: string;
        description: string;
        amount: number;
        type: 'CREDIT' | 'DEBIT';
        category: 'MATERIELS_PREMIER' | 'MAIN_D_OEUVRE' | 'ENERGIE' | 'TRANSPORT' | 'AUTRE';
        referenceNumber?: string;
        relatedOrderId?: string;
        notes?: string;
        subsidiaryId: string;
        createdBy: string;
    }) {
        return this.prisma.prefinancementTransaction.create({
            data: {
                ...createDto,
                date: new Date(createDto.date),
                status: PrefinancementStatus.EN_ATTENTE,
            },
        });
    }

    async findTransactions(filters: {
        subsidiaryId?: string;
        type?: 'CREDIT' | 'DEBIT';
        category?: 'MATERIELS_PREMIER' | 'MAIN_D_OEUVRE' | 'ENERGIE' | 'TRANSPORT' | 'AUTRE';
        status?: 'VALIDE' | 'EN_ATTENTE' | 'ANNULE';
        search?: string;
        startDate?: string;
        endDate?: string;
    }) {
        const where: any = {};

        if (filters.subsidiaryId) {
            where.subsidiaryId = filters.subsidiaryId;
        }
        if (filters.type) {
            where.type = filters.type;
        }
        if (filters.category) {
            where.category = filters.category;
        }
        if (filters.status) {
            where.status = filters.status;
        }
        if (filters.search) {
            where.OR = [
                { description: { contains: filters.search, mode: 'insensitive' } },
                { referenceNumber: { contains: filters.search, mode: 'insensitive' } },
                { notes: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        if (filters.startDate || filters.endDate) {
            where.date = {};
            if (filters.startDate) {
                where.date.gte = new Date(filters.startDate);
            }
            if (filters.endDate) {
                where.date.lte = new Date(filters.endDate);
            }
        }

        return this.prisma.prefinancementTransaction.findMany({
            where,
            orderBy: { date: 'desc' },
        });
    }

    async findTransactionById(id: string) {
        return this.prisma.prefinancementTransaction.findUnique({
            where: { id },
        });
    }

    async updateTransaction(id: string, updateDto: {
        date?: string;
        description?: string;
        amount?: number;
        type?: 'CREDIT' | 'DEBIT';
        category?: 'MATERIELS_PREMIER' | 'MAIN_D_OEUVRE' | 'ENERGIE' | 'TRANSPORT' | 'AUTRE';
        referenceNumber?: string;
        relatedOrderId?: string;
        notes?: string;
    }) {
        const updateData: any = { ...updateDto };
        if (updateDto.date) {
            updateData.date = new Date(updateDto.date);
        }

        return this.prisma.prefinancementTransaction.update({
            where: { id },
            data: updateData,
        });
    }

    async validateTransaction(id: string) {
        return this.prisma.prefinancementTransaction.update({
            where: { id },
            data: { status: PrefinancementStatus.VALIDE },
        });
    }

    async cancelTransaction(id: string) {
        return this.prisma.prefinancementTransaction.update({
            where: { id },
            data: { status: PrefinancementStatus.ANNULE },
        });
    }

    async deleteTransaction(id: string) {
        return this.prisma.prefinancementTransaction.delete({
            where: { id },
        });
    }

    // --- Statistics Method ---
    async getStatistics(subsidiaryId: string) {
        const transactions = await this.prisma.prefinancementTransaction.findMany({
            where: { subsidiaryId },
        });

        const totalCredits = transactions
            .filter(t => t.type === PrefinancementTransactionType.CREDIT && t.status === PrefinancementStatus.VALIDE)
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const totalDebits = transactions
            .filter(t => t.type === PrefinancementTransactionType.DEBIT && t.status === PrefinancementStatus.VALIDE)
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const transactionCount = transactions.length;
        const pendingTransactions = transactions.filter(t => t.status === PrefinancementStatus.EN_ATTENTE).length;

        // Regrouper par catégorie pour les crédits
        const creditsByCategory = transactions
            .filter(t => t.type === PrefinancementTransactionType.CREDIT && t.status === PrefinancementStatus.VALIDE)
            .reduce((acc, t) => {
                const category = t.category;
                if (!acc[category]) {
                    acc[category] = { category, amount: 0, count: 0 };
                }
                acc[category].amount += Number(t.amount);
                acc[category].count += 1;
                return acc;
            }, {} as Record<string, { category: string; amount: number; count: number }>);

        // Regrouper par catégorie pour les débits
        const debitsByCategory = transactions
            .filter(t => t.type === PrefinancementTransactionType.DEBIT && t.status === PrefinancementStatus.VALIDE)
            .reduce((acc, t) => {
                const category = t.category;
                if (!acc[category]) {
                    acc[category] = { category, amount: 0, count: 0 };
                }
                acc[category].amount += Number(t.amount);
                acc[category].count += 1;
                return acc;
            }, {} as Record<string, { category: string; amount: number; count: number }>);

        return {
            totalBalance: totalCredits - totalDebits,
            totalCredits,
            totalDebits,
            transactionCount,
            creditsByCategory: Object.values(creditsByCategory),
            debitsByCategory: Object.values(debitsByCategory),
        };
    }
}
