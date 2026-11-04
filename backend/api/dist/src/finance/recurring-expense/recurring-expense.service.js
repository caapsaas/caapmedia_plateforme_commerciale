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
var RecurringExpenseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecurringExpenseService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const accounting_outbox_service_1 = require("../../accounting/outbox/accounting-outbox.service");
const client_1 = require("@prisma/client");
const check_role_util_1 = require("../../common/auth/role/check-role.util");
const generate_id_util_1 = require("../../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../../common/constants/id-prefixes.const");
const pagination_1 = require("../../common/pagination/pagination");
const BLOCKED_RECURRING_CATEGORIES = [
    client_1.ExpenseCategory.SALARIES,
];
let RecurringExpenseService = RecurringExpenseService_1 = class RecurringExpenseService {
    prisma;
    accountingOutbox;
    logger = new common_1.Logger(RecurringExpenseService_1.name);
    constructor(prisma, accountingOutbox) {
        this.prisma = prisma;
        this.accountingOutbox = accountingOutbox;
    }
    async create(dto, user) {
        (0, check_role_util_1.checkRole)(user, [client_1.UserRole.ADMIN, client_1.UserRole.FINANCIAL_DIRECTOR], 'You do not have permission to create a recurring expense.');
        if (BLOCKED_RECURRING_CATEGORIES.includes(dto.category)) {
            throw new common_1.BadRequestException(`La catégorie "${dto.category}" est pilotée par le module paie et ne peut pas être configurée en dépense récurrente.`);
        }
        const startDate = new Date(dto.startDate);
        return this.prisma.recurringExpense.create({
            data: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.RECURRINGEXPENSE),
                description: dto.description,
                amount: dto.amount,
                category: dto.category,
                expenseRecordType: dto.expenseRecordType,
                frequency: dto.frequency,
                startDate,
                nextExecutionDate: startDate,
                endDate: dto.endDate ? new Date(dto.endDate) : undefined,
                subsidiaryId: user.subsidiaryId,
            },
        });
    }
    async findAll(user, paginationQuery = {}) {
        (0, check_role_util_1.checkRole)(user, [client_1.UserRole.ADMIN, client_1.UserRole.FINANCIAL_DIRECTOR], 'You do not have permission to view recurring expenses.');
        return (0, pagination_1.paginate)(this.prisma.recurringExpense, {
            where: { subsidiaryId: user.subsidiaryId },
            orderBy: { nextExecutionDate: 'asc' },
        }, paginationQuery);
    }
    async findOne(id, user) {
        const recurringExpense = await this.prisma.recurringExpense.findFirst({
            where: { id, subsidiaryId: user.subsidiaryId },
        });
        if (!recurringExpense) {
            throw new common_1.NotFoundException(`Recurring expense with ID "${id}" not found.`);
        }
        return recurringExpense;
    }
    async update(id, dto, user) {
        await this.findOne(id, user);
        (0, check_role_util_1.checkRole)(user, [client_1.UserRole.ADMIN, client_1.UserRole.FINANCIAL_DIRECTOR], 'You do not have permission to update a recurring expense.');
        if (dto.category && BLOCKED_RECURRING_CATEGORIES.includes(dto.category)) {
            throw new common_1.BadRequestException(`La catégorie "${dto.category}" est pilotée par le module paie et ne peut pas être configurée en dépense récurrente.`);
        }
        return this.prisma.recurringExpense.update({
            where: { id },
            data: {
                ...dto,
                startDate: dto.startDate ? new Date(dto.startDate) : undefined,
                endDate: dto.endDate ? new Date(dto.endDate) : undefined,
            },
        });
    }
    async remove(id, user) {
        await this.findOne(id, user);
        (0, check_role_util_1.checkRole)(user, [client_1.UserRole.ADMIN, client_1.UserRole.FINANCIAL_DIRECTOR], 'You do not have permission to delete a recurring expense.');
        return this.prisma.recurringExpense.delete({ where: { id } });
    }
    async processRecurringExpenses() {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const dueExpenses = await this.prisma.recurringExpense.findMany({
            where: { isActive: true, nextExecutionDate: { lte: today } },
        });
        for (const recurring of dueExpenses) {
            try {
                await this.prisma.$transaction(async (tx) => {
                    const record = await tx.expenseRecord.create({
                        data: {
                            id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.EXPENSE),
                            description: recurring.description,
                            amount: recurring.amount,
                            category: recurring.category,
                            expenseRecordType: recurring.expenseRecordType,
                            expenseDate: recurring.nextExecutionDate,
                            subsidiaryId: recurring.subsidiaryId,
                        },
                    });
                    await this.accountingOutbox.enqueue(tx, {
                        eventType: 'EXPENSE_RECORD',
                        subsidiaryId: recurring.subsidiaryId,
                        payload: {
                            userId: 'SYSTEM_RECURRING_EXPENSE',
                            operationDate: record.expenseDate.toISOString(),
                            amount: Number(record.amount),
                            description: record.description,
                            sourceId: record.id,
                            expenseCategory: record.category,
                            withTva: true,
                        },
                    });
                    const nextExecutionDate = this.computeNextExecutionDate(recurring.nextExecutionDate, recurring.frequency);
                    const isPastEndDate = !!recurring.endDate && nextExecutionDate > recurring.endDate;
                    await tx.recurringExpense.update({
                        where: { id: recurring.id },
                        data: {
                            nextExecutionDate,
                            isActive: isPastEndDate ? false : recurring.isActive,
                        },
                    });
                });
                this.logger.log(`✓ Dépense récurrente générée: ${recurring.description} (${recurring.id})`);
            }
            catch (err) {
                const error = err instanceof Error ? err : new Error(String(err));
                this.logger.error(`Erreur lors de la génération de la dépense récurrente ${recurring.id}: ${error.message}`, error.stack);
            }
        }
    }
    computeNextExecutionDate(from, frequency) {
        const next = new Date(from);
        switch (frequency) {
            case client_1.RecurringExpenseFrequency.WEEKLY:
                next.setDate(next.getDate() + 7);
                break;
            case client_1.RecurringExpenseFrequency.MONTHLY:
                next.setMonth(next.getMonth() + 1);
                break;
            case client_1.RecurringExpenseFrequency.YEARLY:
                next.setFullYear(next.getFullYear() + 1);
                break;
        }
        return next;
    }
};
exports.RecurringExpenseService = RecurringExpenseService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RecurringExpenseService.prototype, "processRecurringExpenses", null);
exports.RecurringExpenseService = RecurringExpenseService = RecurringExpenseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        accounting_outbox_service_1.AccountingOutboxService])
], RecurringExpenseService);
//# sourceMappingURL=recurring-expense.service.js.map