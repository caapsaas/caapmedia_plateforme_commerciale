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
exports.BalancesheetService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const client_1 = require("@prisma/client");
const accounting_balance_service_1 = require("../../accounting/shared/accounting-balance.service");
let BalancesheetService = class BalancesheetService {
    prisma;
    balanceService;
    constructor(prisma, balanceService) {
        this.prisma = prisma;
        this.balanceService = balanceService;
    }
    async getBalanceSheet(subsidiaryId) {
        const [treasury, customerReceivables, inventory, equipments, fixedAssets, supplierDebts, longTermDebts, shareCapital, retainedEarnings,] = await Promise.all([
            this.getTreasuryData(subsidiaryId),
            this.getCustomerReceivables(subsidiaryId),
            Promise.resolve(this.getInventoryValue()),
            this.getEquipmentsValue(subsidiaryId),
            this.getFixedAssetsValue(subsidiaryId),
            this.getUnpaidSupplierDebts(subsidiaryId),
            this.getLongTermDebtsBalance(subsidiaryId),
            this.getShareCapital(subsidiaryId),
            this.getRetainedEarnings(subsidiaryId),
        ]);
        const totalAssets = treasury + customerReceivables + inventory + equipments + fixedAssets;
        const totalLiabilities = supplierDebts + longTermDebts;
        const totalEquity = shareCapital + retainedEarnings;
        return {
            assets: {
                treasury,
                customerReceivables,
                inventory,
                equipments,
                fixedAssets,
            },
            totalAssets,
            liabilities: { supplierDebts, longTermDebts },
            totalLiabilities,
            equity: { shareCapital, retainedEarnings },
            totalEquity,
        };
    }
    async getTreasuryData(subsidiaryId) {
        const accounts = await this.prisma.treasuryAccount.findMany({
            where: subsidiaryId ? { subsidiaryId } : {},
            select: { balance: true },
        });
        return accounts.reduce((sum, a) => sum + Number(a.balance), 0);
    }
    async getCustomerReceivables(subsidiaryId) {
        const orders = await this.prisma.order.findMany({
            where: {
                ...(subsidiaryId ? { subsidiaryId } : {}),
                paymentStatus: { not: client_1.PaymentStatus.PAID },
                status: { not: client_1.OrderStatus.CANCELLED },
            },
            select: { totalAmount: true, amountPaid: true },
        });
        return orders.reduce((sum, o) => sum + (Number(o.totalAmount) - Number(o.amountPaid)), 0);
    }
    getInventoryValue() {
        return 0;
    }
    async getEquipmentsValue(subsidiaryId) {
        const equipments = await this.prisma.equipment.findMany({
            where: subsidiaryId ? { subsidiaryId } : {},
            select: { acquisitionValue: true },
        });
        return equipments.reduce((sum, e) => sum + Number(e.acquisitionValue), 0);
    }
    async getFixedAssetsValue(subsidiaryId) {
        const now = new Date();
        const [gross, amortization] = await Promise.all([
            this.balanceService.getAccountBalanceByPrefix(['211', '215', '218'], null, now, subsidiaryId),
            this.balanceService.getAccountBalance(['281'], null, now, 'CREDIT', subsidiaryId),
        ]);
        return gross - Math.abs(amortization);
    }
    async getUnpaidSupplierDebts(subsidiaryId) {
        const debts = await this.prisma.supplierDebt.findMany({
            where: {
                ...(subsidiaryId ? { subsidiaryId } : {}),
                status: { not: client_1.DebtStatus.PAYER },
            },
            select: { amount: true },
        });
        return debts.reduce((sum, d) => sum + Number(d.amount), 0);
    }
    async getLongTermDebtsBalance(subsidiaryId) {
        const debts = await this.prisma.longTermDebt.findMany({
            where: subsidiaryId ? { subsidiaryId } : {},
            select: { currentBalance: true },
        });
        return debts.reduce((sum, d) => sum + Number(d.currentBalance), 0);
    }
    async getShareCapital(subsidiaryId) {
        if (subsidiaryId) {
            const sub = await this.prisma.subsidiary.findUnique({
                where: { id: subsidiaryId },
                select: { shareCapital: true },
            });
            return Number(sub?.shareCapital) || 0;
        }
        const subs = await this.prisma.subsidiary.findMany({
            select: { shareCapital: true },
        });
        return subs.reduce((sum, s) => sum + Number(s.shareCapital), 0);
    }
    async getRetainedEarnings(subsidiaryId) {
        const where = subsidiaryId ? { subsidiaryId } : {};
        const [sales, expenses, payrolls] = await Promise.all([
            this.prisma.sale.findMany({
                where: { ...where, status: 'PAID' },
                select: { totalPrice: true },
            }),
            this.prisma.expenseRecord.findMany({
                where,
                select: { amount: true },
            }),
            this.prisma.payrollRecord.findMany({
                where,
                select: { netSalary: true, deductions: true },
            }),
        ]);
        const totalRevenue = sales.reduce((sum, s) => sum + Number(s.totalPrice), 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
        const totalPayroll = payrolls.reduce((sum, p) => sum + Number(p.netSalary) + Number(p.deductions), 0);
        return totalRevenue - totalExpenses - totalPayroll;
    }
    async getSupplierDebts(subsidiaryId) {
        return this.getUnpaidSupplierDebts(subsidiaryId);
    }
    async getAccumulatedNetIncome(subsidiaryId) {
        return this.getRetainedEarnings(subsidiaryId);
    }
};
exports.BalancesheetService = BalancesheetService;
exports.BalancesheetService = BalancesheetService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        accounting_balance_service_1.AccountingBalanceService])
], BalancesheetService);
//# sourceMappingURL=balancesheet.service.js.map