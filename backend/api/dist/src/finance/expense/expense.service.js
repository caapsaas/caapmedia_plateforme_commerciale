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
exports.ExpensesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const client_1 = require("@prisma/client");
const check_role_util_1 = require("../../common/auth/role/check-role.util");
const accounting_outbox_service_1 = require("../../accounting/outbox/accounting-outbox.service");
const generate_id_util_1 = require("../../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../../common/constants/id-prefixes.const");
const pagination_1 = require("../../common/pagination/pagination");
let ExpensesService = class ExpensesService {
    prisma;
    accountingOutbox;
    constructor(prisma, accountingOutbox) {
        this.prisma = prisma;
        this.accountingOutbox = accountingOutbox;
    }
    async create(createExpenseDto, user) {
        (0, check_role_util_1.checkRole)(user, [client_1.UserRole.ADMIN, client_1.UserRole.FINANCIAL_DIRECTOR], 'You do not have permission to create an expense.');
        return this.prisma.$transaction(async (tx) => {
            const record = await tx.expenseRecord.create({
                data: {
                    id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.EXPENSE),
                    ...createExpenseDto,
                    expenseDate: new Date(createExpenseDto.expenseDate),
                    subsidiaryId: user.subsidiaryId,
                },
            });
            await this.accountingOutbox.enqueue(tx, {
                eventType: 'EXPENSE_RECORD',
                subsidiaryId: user.subsidiaryId,
                payload: {
                    userId: user.id,
                    operationDate: record.expenseDate.toISOString(),
                    amount: Number(record.amount),
                    description: record.description,
                    sourceId: record.id,
                    expenseCategory: record.category,
                    withTva: true,
                },
            });
            return record;
        });
    }
    async findAll(user, paginationQuery = {}) {
        (0, check_role_util_1.checkRole)(user, [client_1.UserRole.ADMIN, client_1.UserRole.FINANCIAL_DIRECTOR, client_1.UserRole.CAISSIER], 'You do not have permission to view expenses.');
        const where = {
            subsidiaryId: user.subsidiaryId,
        };
        if (paginationQuery.search) {
            where.description = {
                contains: paginationQuery.search,
                mode: 'insensitive',
            };
        }
        return (0, pagination_1.paginate)(this.prisma.expenseRecord, { where, orderBy: { expenseDate: 'desc' } }, paginationQuery);
    }
    async findOne(id, user) {
        const expense = await this.prisma.expenseRecord.findUnique({
            where: { id },
        });
        if (!expense) {
            throw new common_1.NotFoundException(`Expense with ID "${id}" not found.`);
        }
        if (expense.subsidiaryId !== user.subsidiaryId) {
            throw new common_1.ForbiddenException('You do not have permission to view this expense.');
        }
        return expense;
    }
    async update(id, updateExpenseDto, user) {
        await this.findOne(id, user);
        (0, check_role_util_1.checkRole)(user, [client_1.UserRole.ADMIN, client_1.UserRole.FINANCIAL_DIRECTOR], 'You do not have permission to update an expense.');
        return this.prisma.expenseRecord.update({
            where: { id },
            data: {
                ...updateExpenseDto,
                amount: updateExpenseDto.amount,
                expenseDate: updateExpenseDto.expenseDate
                    ? new Date(updateExpenseDto.expenseDate)
                    : undefined,
            },
        });
    }
    async remove(id, user) {
        await this.findOne(id, user);
        (0, check_role_util_1.checkRole)(user, [client_1.UserRole.ADMIN, client_1.UserRole.FINANCIAL_DIRECTOR], 'You do not have permission to delete an expense.');
        return this.prisma.expenseRecord.delete({
            where: { id },
        });
    }
};
exports.ExpensesService = ExpensesService;
exports.ExpensesService = ExpensesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        accounting_outbox_service_1.AccountingOutboxService])
], ExpensesService);
//# sourceMappingURL=expense.service.js.map