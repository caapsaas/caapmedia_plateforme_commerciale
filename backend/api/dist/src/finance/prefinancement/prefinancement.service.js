"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrefinancementService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const client_1 = require("@prisma/client");
const treasury_service_1 = require("../treasury/treasury.service");
const pagination_1 = require("../../common/pagination/pagination");
let PrefinancementService = class PrefinancementService {
    prisma;
    treasuryService;
    constructor(prisma, treasuryService) {
        this.prisma = prisma;
        this.treasuryService = treasuryService;
    }
    async createAccount(createDto) {
        return this.prisma.prefinancementAccount.create({
            data: {
                id: crypto.randomUUID(),
                accountName: createDto.accountName,
                balance: createDto.initialBalance || 0,
                subsidiaryId: createDto.subsidiaryId,
            },
        });
    }
    async findAccount(subsidiaryId) {
        if (!subsidiaryId) {
            return null;
        }
        const treasuryAccount = await this.treasuryService.findPrefinancementAccount(subsidiaryId);
        if (!treasuryAccount) {
            return null;
        }
        return {
            id: treasuryAccount.id,
            accountName: treasuryAccount.accountName,
            balance: Number(treasuryAccount.balance),
            currency: treasuryAccount.currency,
            lastUpdated: new Date().toISOString(),
            subsidiaryId: treasuryAccount.subsidiaryId,
        };
    }
    async updateAccount(accountId, updateDto) {
        const updateData = { ...updateDto };
        if (updateDto.initialBalance !== undefined) {
            updateData.balance = updateDto.initialBalance;
            delete updateData.initialBalance;
        }
        return this.prisma.prefinancementAccount.update({
            where: { id: accountId },
            data: updateData,
        });
    }
    async createTransaction(createDto) {
        const { date, ...rest } = createDto;
        return this.prisma.prefinancementTransaction.create({
            data: {
                id: crypto.randomUUID(),
                ...rest,
                date: new Date(date),
                status: client_1.PrefinancementStatus.EN_ATTENTE,
            },
        });
    }
    async findTransactions(filters) {
        const where = {};
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
        return (0, pagination_1.paginate)(this.prisma.prefinancementTransaction, { where, orderBy: { date: 'desc' } }, filters);
    }
    async findTransactionById(id) {
        return this.prisma.prefinancementTransaction.findUnique({
            where: { id },
        });
    }
    async updateTransaction(id, updateDto) {
        const updateData = { ...updateDto };
        if (updateDto.date) {
            updateData.date = new Date(updateDto.date);
        }
        return this.prisma.prefinancementTransaction.update({
            where: { id },
            data: updateData,
        });
    }
    async validateTransaction(id) {
        return this.prisma.$transaction(async (tx) => {
            const transaction = await tx.prefinancementTransaction.findUnique({
                where: { id },
            });
            if (!transaction) {
                throw new Error('Transaction not found');
            }
            if (transaction.status !== client_1.PrefinancementStatus.EN_ATTENTE) {
                throw new Error('Only pending transactions can be validated');
            }
            const updatedTransaction = await tx.prefinancementTransaction.update({
                where: { id },
                data: { status: client_1.PrefinancementStatus.VALIDE },
            });
            const prefinancementAccount = await this.treasuryService.findPrefinancementAccount(transaction.subsidiaryId);
            if (prefinancementAccount) {
                const balanceUpdateOperation = transaction.type === client_1.PrefinancementTransactionType.CREDIT
                    ? { increment: transaction.amount }
                    : { decrement: transaction.amount };
                await tx.treasuryAccount.update({
                    where: { id: prefinancementAccount.id },
                    data: { balance: balanceUpdateOperation },
                });
            }
            return updatedTransaction;
        });
    }
    async cancelTransaction(id) {
        return this.prisma.$transaction(async (tx) => {
            const transaction = await tx.prefinancementTransaction.findUnique({
                where: { id },
            });
            if (!transaction) {
                throw new Error('Transaction not found');
            }
            if (transaction.status === client_1.PrefinancementStatus.ANNULE) {
                throw new Error('Transaction is already cancelled');
            }
            if (transaction.status === client_1.PrefinancementStatus.VALIDE) {
                const prefinancementAccount = await this.treasuryService.findPrefinancementAccount(transaction.subsidiaryId);
                if (prefinancementAccount) {
                    const balanceUpdateOperation = transaction.type === client_1.PrefinancementTransactionType.CREDIT
                        ? { decrement: transaction.amount }
                        : { increment: transaction.amount };
                    await tx.treasuryAccount.update({
                        where: { id: prefinancementAccount.id },
                        data: { balance: balanceUpdateOperation },
                    });
                }
            }
            return await tx.prefinancementTransaction.update({
                where: { id },
                data: { status: client_1.PrefinancementStatus.ANNULE },
            });
        });
    }
    async deleteTransaction(id) {
        return this.prisma.$transaction(async (tx) => {
            const transaction = await tx.prefinancementTransaction.findUnique({
                where: { id },
            });
            if (!transaction) {
                throw new Error('Transaction not found');
            }
            if (transaction.status === client_1.PrefinancementStatus.VALIDE) {
                const prefinancementAccount = await this.treasuryService.findPrefinancementAccount(transaction.subsidiaryId);
                if (prefinancementAccount) {
                    const balanceUpdateOperation = transaction.type === client_1.PrefinancementTransactionType.CREDIT
                        ? { decrement: transaction.amount }
                        : { increment: transaction.amount };
                    await tx.treasuryAccount.update({
                        where: { id: prefinancementAccount.id },
                        data: { balance: balanceUpdateOperation },
                    });
                }
            }
            return await tx.prefinancementTransaction.delete({
                where: { id },
            });
        });
    }
    async getStatistics(subsidiaryId) {
        const transactions = await this.prisma.prefinancementTransaction.findMany({
            where: { subsidiaryId },
        });
        const totalCredits = transactions
            .filter((t) => (t.type === client_1.PrefinancementTransactionType.CREDIT &&
            t.status === client_1.PrefinancementStatus.VALIDE) ||
            t.status === client_1.PrefinancementStatus.EN_ATTENTE)
            .reduce((sum, t) => sum + Number(t.amount), 0);
        const totalDebits = transactions
            .filter((t) => t.type === client_1.PrefinancementTransactionType.DEBIT &&
            (t.status === client_1.PrefinancementStatus.VALIDE ||
                t.status === client_1.PrefinancementStatus.EN_ATTENTE))
            .reduce((sum, t) => sum + Number(t.amount), 0);
        const transactionCount = transactions.length;
        const pendingTransactions = transactions.filter((t) => t.status === client_1.PrefinancementStatus.EN_ATTENTE).length;
        const creditsByCategory = transactions
            .filter((t) => (t.type === client_1.PrefinancementTransactionType.CREDIT &&
            t.status === client_1.PrefinancementStatus.VALIDE) ||
            t.status === client_1.PrefinancementStatus.EN_ATTENTE)
            .reduce((acc, t) => {
            const category = t.category;
            if (!acc[category]) {
                acc[category] = { category, amount: 0, count: 0 };
            }
            acc[category].amount += Number(t.amount);
            acc[category].count += 1;
            return acc;
        }, {});
        const debitsByCategory = transactions
            .filter((t) => t.type === client_1.PrefinancementTransactionType.DEBIT &&
            (t.status === client_1.PrefinancementStatus.VALIDE ||
                t.status === client_1.PrefinancementStatus.EN_ATTENTE))
            .reduce((acc, t) => {
            const category = t.category;
            if (!acc[category]) {
                acc[category] = { category, amount: 0, count: 0 };
            }
            acc[category].amount += Number(t.amount);
            acc[category].count += 1;
            return acc;
        }, {});
        return {
            totalBalance: totalCredits - totalDebits,
            totalCredits,
            totalDebits,
            transactionCount,
            creditsByCategory: Object.values(creditsByCategory),
            debitsByCategory: Object.values(debitsByCategory),
        };
    }
};
exports.PrefinancementService = PrefinancementService;
exports.PrefinancementService = PrefinancementService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        treasury_service_1.TreasuryService])
], PrefinancementService);
//# sourceMappingURL=prefinancement.service.js.map