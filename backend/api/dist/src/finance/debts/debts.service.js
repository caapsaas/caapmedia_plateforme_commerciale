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
exports.DebtsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const client_1 = require("@prisma/client");
const check_role_util_1 = require("../../common/auth/role/check-role.util");
const accounting_outbox_service_1 = require("../../accounting/outbox/accounting-outbox.service");
const generate_id_util_1 = require("../../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../../common/constants/id-prefixes.const");
const pagination_1 = require("../../common/pagination/pagination");
const subsidiary_scope_1 = require("../../common/utils/subsidiary-scope");
let DebtsService = class DebtsService {
    prisma;
    accountingOutbox;
    constructor(prisma, accountingOutbox) {
        this.prisma = prisma;
        this.accountingOutbox = accountingOutbox;
    }
    async findAllSupplierDebts(user, paginationQuery = {}) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(user);
        const debtInclude = {
            purchaseOrder: { select: { totalAmount: true, amountPaid: true } },
            subsidiary: { select: { subsidiaryName: true } },
        };
        const result = await (0, pagination_1.paginate)(this.prisma.supplierDebt, {
            where: (0, subsidiary_scope_1.withSubsidiaryScope)({ status: { not: client_1.DebtStatus.PAYER } }, ctx),
            orderBy: { dueDate: 'asc' },
            include: debtInclude,
        }, paginationQuery);
        return {
            ...result,
            data: result.data.map((d) => ({
                ...d,
                amount: Number(d.amount),
                subsidiary: d.subsidiary
                    ? { subsidiaryName: d.subsidiary.subsidiaryName }
                    : undefined,
                purchaseOrder: d.purchaseOrder
                    ? {
                        totalAmount: Number(d.purchaseOrder.totalAmount),
                        amountPaid: Number(d.purchaseOrder.amountPaid),
                    }
                    : undefined,
            })),
        };
    }
    async paySupplierDebt(id, dto, user) {
        (0, check_role_util_1.checkRole)(user, [], 'Seul le super-administrateur peut payer une dette fournisseur.');
        const debt = await this.prisma.supplierDebt.findFirst({
            where: { id },
            include: { purchaseOrder: true },
        });
        if (!debt) {
            throw new common_1.NotFoundException(`Supplier debt with ID "${id}" not found.`);
        }
        if (debt.status === client_1.DebtStatus.PAYER) {
            throw new common_1.BadRequestException('Cette dette est déjà payée.');
        }
        const account = await this.prisma.treasuryAccount.findFirst({
            where: { id: dto.treasuryAccountId },
        });
        if (!account) {
            throw new common_1.NotFoundException(`Treasury account with ID "${dto.treasuryAccountId}" not found.`);
        }
        if (account.accountType !== client_1.AccountType.SAFE &&
            account.accountType !== client_1.AccountType.BANQUE) {
            throw new common_1.BadRequestException("Le paiement d'une dette fournisseur ne peut se faire que depuis le coffre-fort ou une banque.");
        }
        const paymentAmount = dto.amount
            ? new client_1.Prisma.Decimal(dto.amount)
            : debt.amount;
        if (paymentAmount.lte(0)) {
            throw new common_1.BadRequestException('Le montant à payer doit être positif.');
        }
        if (paymentAmount.greaterThan(debt.amount)) {
            throw new common_1.BadRequestException('Le montant ne peut pas dépasser le solde restant de la dette.');
        }
        if (account.balance.comparedTo(paymentAmount) < 0) {
            throw new common_1.BadRequestException(`Solde insuffisant sur "${account.accountName}". Solde: ${Number(account.balance)}, Montant: ${Number(paymentAmount)}.`);
        }
        return this.prisma.$transaction(async (tx) => {
            const updatedAccount = await tx.treasuryAccount.update({
                where: { id: account.id },
                data: { balance: { decrement: paymentAmount } },
            });
            const remainingDebt = debt.amount.sub(paymentAmount);
            const newDebtStatus = remainingDebt.isZero()
                ? client_1.DebtStatus.PAYER
                : client_1.DebtStatus.PARTIELLEMENT_PAYE;
            const updatedDebt = await tx.supplierDebt.update({
                where: { id },
                data: { amount: remainingDebt, status: newDebtStatus },
            });
            const po = debt.purchaseOrder;
            const newAmountPaid = po.amountPaid.add(paymentAmount);
            const newPaymentStatus = newAmountPaid.gte(po.totalAmount)
                ? client_1.PaymentStatus.PAID
                : client_1.PaymentStatus.PARTIALLY_PAID;
            await tx.purchaseOrder.update({
                where: { id: po.id },
                data: { amountPaid: newAmountPaid, paymentStatus: newPaymentStatus },
            });
            await tx.purchaseOrderHistory.create({
                data: {
                    purchaseOrderId: po.id,
                    eventName: `Paiement de ${Number(paymentAmount)} enregistré (${account.accountName})`,
                },
            });
            const transaction = await tx.financialTransaction.create({
                data: {
                    id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.TREASURY),
                    description: `Paiement facture fournisseur: ${debt.supplierName} - Facture N°${debt.invoiceId}`,
                    amount: paymentAmount,
                    financialTransactionType: client_1.TransactionType.DEPENSE,
                    treasuryAccountId: account.id,
                    sourceAccountId: account.id,
                    subsidiaryId: account.subsidiaryId,
                    transactionDate: new Date(dto.paymentDate),
                    status: client_1.TransactionStatus.VALIDE,
                    relatedDocumentId: debt.id,
                    balanceAfterSource: updatedAccount.balance,
                },
            });
            await this.accountingOutbox.enqueue(tx, {
                eventType: 'SUPPLIER_DEBT_PAYMENT',
                subsidiaryId: account.subsidiaryId,
                payload: {
                    userId: user.id,
                    operationDate: new Date(dto.paymentDate).toISOString(),
                    amount: Number(paymentAmount),
                    description: transaction.description,
                    sourceId: transaction.id,
                    accountType: account.accountType,
                },
            });
            return updatedDebt;
        });
    }
    async createLongTermDebt(dto, user) {
        (0, check_role_util_1.checkRole)(user, [client_1.UserRole.ADMIN, client_1.UserRole.FINANCIAL_DIRECTOR], 'Permission denied to create long-term debts.');
        return this.prisma.longTermDebt.create({
            data: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.LONGTERDEBT),
                ...dto,
                currentBalance: dto.initialAmount,
                maturityDate: new Date(dto.maturityDate),
                subsidiaryId: user.subsidiaryId,
            },
        });
    }
    async findAllLongTermDebts(user, paginationQuery = {}) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(user);
        const result = await (0, pagination_1.paginate)(this.prisma.longTermDebt, {
            where: (0, subsidiary_scope_1.withSubsidiaryScope)({}, ctx),
            orderBy: { maturityDate: 'asc' },
        }, paginationQuery);
        return {
            ...result,
            data: result.data.map((d) => ({
                ...d,
                initialAmount: Number(d.initialAmount),
                currentBalance: Number(d.currentBalance),
                interestRate: Number(d.interestRate),
            })),
        };
    }
    async updateLongTermDebt(id, dto, user) {
        (0, check_role_util_1.checkRole)(user, [client_1.UserRole.ADMIN, client_1.UserRole.FINANCIAL_DIRECTOR], 'Permission denied to update long-term debts.');
        const debt = await this.prisma.longTermDebt.findFirst({
            where: { id, subsidiaryId: user.subsidiaryId },
        });
        if (!debt) {
            throw new common_1.NotFoundException(`Long-term debt with ID "${id}" not found.`);
        }
        return this.prisma.longTermDebt.update({ where: { id }, data: dto });
    }
};
exports.DebtsService = DebtsService;
exports.DebtsService = DebtsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        accounting_outbox_service_1.AccountingOutboxService])
], DebtsService);
//# sourceMappingURL=debts.service.js.map