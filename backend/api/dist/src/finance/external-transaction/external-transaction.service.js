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
exports.ExternalTransactionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const notifications_service_1 = require("../../notifications/notifications.service");
const pagination_1 = require("../../common/pagination/pagination");
const client_1 = require("@prisma/client");
let ExternalTransactionService = class ExternalTransactionService {
    prisma;
    notificationsService;
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    async notifyAdminsAndFinancialDirectors(subsidiaryId, payload) {
        await Promise.all([
            this.notificationsService.notifyUsersByRole(subsidiaryId, client_1.UserRole.ADMIN, payload),
            this.notificationsService.notifyUsersByRole(subsidiaryId, client_1.UserRole.FINANCIAL_DIRECTOR, payload),
        ]);
    }
    formatAmount(amount) {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    }
    async create(createDto) {
        try {
            console.log('Creating external transaction with DTO:', JSON.stringify(createDto, null, 2));
            console.log('Available ExternalTransactionType values:', Object.values(client_1.ExternalTransactionType));
            console.log('Available ExternalTransactionCategory values:', Object.values(client_1.ExternalTransactionCategory));
            console.log('Available PaymentMethod values:', Object.values(client_1.PaymentMethod));
            const transaction = await this.prisma.externalFinancialTransaction.create({
                data: {
                    ...createDto,
                    status: client_1.ExternalTransactionStatus.DRAFT,
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
            await this.notifyAdminsAndFinancialDirectors(transaction.subsidiaryId, {
                title: 'Nouvelle Transaction Externe Créée',
                message: `${transaction.creator.userName || transaction.creator.email} a créé une nouvelle transaction externe : ${transaction.description} pour ${this.formatAmount(transaction.amount.toNumber())}`,
                type: client_1.NotificationType.EXTERNAL_TRANSACTION_CREATED,
                data: {
                    transactionId: transaction.id,
                    subsidiaryId: transaction.subsidiaryId,
                    createdBy: transaction.createdBy,
                    userName: transaction.creator.userName || transaction.creator.email,
                    action: 'created',
                },
            });
            return transaction;
        }
        catch (error) {
            console.error('Error creating external transaction:', error);
            console.error('Full error object:', JSON.stringify(error, null, 2));
            console.error('Error details:', {
                code: error.code,
                message: error.message,
                meta: error.meta,
                cause: error.cause,
                stack: error.stack,
            });
            if (error.code === 'P2002') {
                throw new common_1.BadRequestException('Erreur de contrainte unique: une transaction avec ces données existe déjà.');
            }
            if (error.code === 'P2025') {
                throw new common_1.BadRequestException("Erreur: enregistrement non trouvé. Vérifiez que l'utilisateur et la filiale existent.");
            }
            if (error.code === 'P2003' || error.code === 'P2004') {
                throw new common_1.BadRequestException("Erreur de clé étrangère: vérifiez que l'utilisateur et la filiale existent.");
            }
            if (error.message) {
                const fullMessage = error.message;
                console.error('Full validation error message:', fullMessage);
                if (fullMessage.includes('Invalid value')) {
                    const lines = fullMessage.split('\n').filter((line) => line.trim());
                    const relevantLine = lines.find((line) => line.includes('Invalid value') ||
                        line.includes('Got') ||
                        line.includes('Expected')) || lines[0];
                    throw new common_1.BadRequestException(`Erreur de validation: ${relevantLine}`);
                }
            }
            throw new common_1.BadRequestException(`Erreur lors de la création de la transaction: ${error.message}`);
        }
    }
    async findAll(query) {
        const where = {
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
                where.transactionDate.lte = new Date(query.endDate);
            }
        }
        if (query.search) {
            where.OR = [
                { description: { contains: query.search, mode: 'insensitive' } },
                { referenceNumber: { contains: query.search, mode: 'insensitive' } },
            ];
        }
        return (0, pagination_1.paginate)(this.prisma.externalFinancialTransaction, {
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
        }, query);
    }
    async findOne(id) {
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
            throw new common_1.NotFoundException(`Transaction avec l'ID ${id} non trouvée`);
        }
        return transaction;
    }
    async update(id, updateDto) {
        const existingTransaction = await this.findOne(id);
        if (existingTransaction.status === client_1.ExternalTransactionStatus.VALIDATED) {
            throw new common_1.BadRequestException('Impossible de modifier une transaction validée');
        }
        const { createdBy, subsidiaryId, ...validUpdateData } = updateDto;
        const updateData = { ...validUpdateData };
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
        await this.notifyAdminsAndFinancialDirectors(updatedTransaction.subsidiaryId, {
            title: 'Transaction Externe Modifiée',
            message: `${updatedTransaction.creator.userName || updatedTransaction.creator.email} a modifié la transaction externe : ${updatedTransaction.description} pour ${this.formatAmount(updatedTransaction.amount.toNumber())}`,
            type: client_1.NotificationType.EXTERNAL_TRANSACTION_VALIDATED,
            data: {
                transactionId: updatedTransaction.id,
                subsidiaryId: updatedTransaction.subsidiaryId,
                createdBy: updatedTransaction.createdBy,
                userName: updatedTransaction.creator.userName ||
                    updatedTransaction.creator.email,
                action: 'updated',
            },
        });
        return updatedTransaction;
    }
    async validate(id, validatorUserId) {
        const transaction = await this.findOne(id);
        if (transaction.status === client_1.ExternalTransactionStatus.VALIDATED) {
            throw new common_1.BadRequestException('Cette transaction est déjà validée');
        }
        if (transaction.status === client_1.ExternalTransactionStatus.CANCELLED) {
            throw new common_1.BadRequestException('Impossible de valider une transaction annulée');
        }
        let validatorUser = null;
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
                status: client_1.ExternalTransactionStatus.VALIDATED,
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
        if (validatorUser && validatorUser.userRole === 'FINANCIAL_DIRECTOR') {
            await this.notificationsService.notifyUsersByRole(validatedTransaction.subsidiaryId, client_1.UserRole.ADMIN, {
                title: 'Transaction Externe Validée par un Directeur Financier',
                message: `Le directeur financier ${validatorUser.userName || validatorUser.email} a validé la transaction externe : ${validatedTransaction.description} pour ${this.formatAmount(validatedTransaction.amount.toNumber())}`,
                type: client_1.NotificationType.EXTERNAL_TRANSACTION_VALIDATED,
                data: {
                    transactionId: validatedTransaction.id,
                    subsidiaryId: validatedTransaction.subsidiaryId,
                    createdBy: validatedTransaction.createdBy,
                    validatedBy: validatorUser.id,
                    validatorName: validatorUser.userName || validatorUser.email,
                    action: 'validated_by_financial_director',
                },
            });
        }
        else {
            await this.notifyAdminsAndFinancialDirectors(validatedTransaction.subsidiaryId, {
                title: 'Transaction Externe Validée',
                message: `${validatedTransaction.creator.userName || validatedTransaction.creator.email} a validé la transaction externe : ${validatedTransaction.description} pour ${this.formatAmount(validatedTransaction.amount.toNumber())}`,
                type: client_1.NotificationType.EXTERNAL_TRANSACTION_VALIDATED,
                data: {
                    transactionId: validatedTransaction.id,
                    subsidiaryId: validatedTransaction.subsidiaryId,
                    createdBy: validatedTransaction.createdBy,
                    userName: validatedTransaction.creator.userName ||
                        validatedTransaction.creator.email,
                    action: 'validated',
                },
            });
        }
        return validatedTransaction;
    }
    async cancel(id) {
        const transaction = await this.findOne(id);
        if (transaction.status === client_1.ExternalTransactionStatus.CANCELLED) {
            throw new common_1.BadRequestException('Cette transaction est déjà annulée');
        }
        const cancelledTransaction = await this.prisma.externalFinancialTransaction.update({
            where: { id },
            data: {
                status: client_1.ExternalTransactionStatus.CANCELLED,
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
        await this.notifyAdminsAndFinancialDirectors(cancelledTransaction.subsidiaryId, {
            title: 'Transaction Externe Annulée',
            message: `${cancelledTransaction.creator.userName || cancelledTransaction.creator.email} a annulé la transaction externe : ${cancelledTransaction.description} pour ${this.formatAmount(cancelledTransaction.amount.toNumber())}`,
            type: client_1.NotificationType.EXTERNAL_TRANSACTION_CANCELLED,
            data: {
                transactionId: cancelledTransaction.id,
                subsidiaryId: cancelledTransaction.subsidiaryId,
                createdBy: cancelledTransaction.createdBy,
                userName: cancelledTransaction.creator.userName ||
                    cancelledTransaction.creator.email,
                action: 'cancelled',
            },
        });
        return cancelledTransaction;
    }
    async remove(id) {
        const transaction = await this.findOne(id);
        if (transaction.status === client_1.ExternalTransactionStatus.VALIDATED) {
            throw new common_1.BadRequestException('Impossible de supprimer une transaction validée');
        }
        await this.prisma.externalFinancialTransaction.delete({
            where: { id },
        });
        return { message: 'Transaction supprimée avec succès' };
    }
    async adminUpdate(id, updateDto, adminUserId) {
        const existingTransaction = await this.findOne(id);
        const adminUser = await this.prisma.user.findUnique({
            where: { id: adminUserId },
            select: { userRole: true },
        });
        if (!adminUser ||
            !['ADMIN', 'FINANCIAL_DIRECTOR'].includes(adminUser.userRole)) {
            throw new common_1.BadRequestException('Accès refusé: réservé aux administrateurs et directeurs financiers');
        }
        const updateData = { ...updateDto };
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
    async adminRemove(id, adminUserId) {
        const transaction = await this.findOne(id);
        const adminUser = await this.prisma.user.findUnique({
            where: { id: adminUserId },
            select: { userRole: true },
        });
        if (!adminUser ||
            !['ADMIN', 'FINANCIAL_DIRECTOR'].includes(adminUser.userRole)) {
            throw new common_1.BadRequestException('Accès refusé: réservé aux administrateurs et directeurs financiers');
        }
        await this.prisma.externalFinancialTransaction.delete({
            where: { id },
        });
        return {
            message: "Transaction validée supprimée avec succès par l'administrateur",
        };
    }
    async getStatistics(subsidiaryId) {
        const [totalTransactions, totalAmount, transactionsByType, transactionsByCategory, transactionsByStatus, recentTransactions,] = await Promise.all([
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
};
exports.ExternalTransactionService = ExternalTransactionService;
exports.ExternalTransactionService = ExternalTransactionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], ExternalTransactionService);
//# sourceMappingURL=external-transaction.service.js.map