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
exports.IncomestatementService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
let IncomestatementService = class IncomestatementService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getIncomeStatement(subsidiaryId, startDate, endDate) {
        const [revenue, cogs, taxes, operatingExpenses] = await Promise.all([
            this.getRevenue(subsidiaryId, startDate, endDate),
            this.getCostOfGoodsSold(subsidiaryId, startDate, endDate),
            this.getTaxes(subsidiaryId, startDate, endDate),
            this.getOperatingExpenses(subsidiaryId, startDate, endDate),
        ]);
        const grossProfit = revenue - cogs;
        const netIncome = grossProfit - operatingExpenses - taxes;
        return { revenue, cogs, grossProfit, operatingExpenses, taxes, netIncome };
    }
    async getRevenue(subsidiaryId, startDate, endDate) {
        const sales = await this.prisma.sale.findMany({
            where: {
                ...(subsidiaryId ? { subsidiaryId } : {}),
                status: 'PAID',
                saleDate: this.buildDateRange(startDate, endDate),
            },
            select: { totalPrice: true },
        });
        return sales.reduce((sum, s) => sum + Number(s.totalPrice), 0);
    }
    async getCostOfGoodsSold(_subsidiaryId, _startDate, _endDate) {
        return 0;
    }
    async getOperatingExpenses(subsidiaryId, startDate, endDate) {
        const where = {
            ...(subsidiaryId ? { subsidiaryId } : {}),
        };
        const [expenses, payrolls] = await Promise.all([
            this.prisma.expenseRecord.findMany({
                where: {
                    ...where,
                    expenseDate: this.buildDateRange(startDate, endDate),
                },
                select: { amount: true },
            }),
            this.prisma.payrollRecord.findMany({
                where,
                select: { netSalary: true, deductions: true },
            }),
        ]);
        const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
        const totalPayroll = payrolls.reduce((sum, p) => sum + Number(p.netSalary) + Number(p.deductions), 0);
        return totalExpenses + totalPayroll;
    }
    async getTaxes(subsidiaryId, startDate, endDate) {
        const sales = await this.prisma.sale.findMany({
            where: {
                ...(subsidiaryId ? { subsidiaryId } : {}),
                status: 'PAID',
                saleDate: this.buildDateRange(startDate, endDate),
            },
            select: { totalPrice: true, taxRate: true },
        });
        return sales.reduce((sum, s) => sum + Number(s.totalPrice) * (Number(s.taxRate) / 100), 0);
    }
    buildDateRange(startDate, endDate) {
        if (!startDate && !endDate)
            return undefined;
        const range = {};
        if (startDate)
            range.gte = new Date(startDate);
        if (endDate)
            range.lte = new Date(endDate);
        return range;
    }
    async getRevenueData(subsidiaryId, startDate, endDate) {
        return this.getRevenue(subsidiaryId, startDate, endDate);
    }
    async getCogsData(subsidiaryId, startDate, endDate) {
        return this.getCostOfGoodsSold(subsidiaryId, startDate, endDate);
    }
    async getOperatingExpensesData(subsidiaryId, startDate, endDate) {
        return this.getOperatingExpenses(subsidiaryId, startDate, endDate);
    }
    async getTaxesData(subsidiaryId, startDate, endDate) {
        return this.getTaxes(subsidiaryId, startDate, endDate);
    }
};
exports.IncomestatementService = IncomestatementService;
exports.IncomestatementService = IncomestatementService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], IncomestatementService);
//# sourceMappingURL=incomestatement.service.js.map