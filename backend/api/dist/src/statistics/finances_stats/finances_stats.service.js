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
exports.FinancesStatsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const period_filter_dto_1 = require("../analytics/dto/period-filter.dto");
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
let FinancesStatsService = class FinancesStatsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    getDateFilter(periodFilterDto, dateField) {
        const { period, startDate, endDate } = periodFilterDto;
        const now = new Date();
        let dateFilter = {};
        switch (period) {
            case period_filter_dto_1.PeriodFilter.THIS_MONTH:
                dateFilter = { gte: (0, date_fns_1.startOfMonth)(now), lte: (0, date_fns_1.endOfMonth)(now) };
                break;
            case period_filter_dto_1.PeriodFilter.LAST_MONTH:
                const lastMonth = (0, date_fns_1.subMonths)(now, 1);
                dateFilter = {
                    gte: (0, date_fns_1.startOfMonth)(lastMonth),
                    lte: (0, date_fns_1.endOfMonth)(lastMonth),
                };
                break;
            case period_filter_dto_1.PeriodFilter.LAST_7_DAYS:
                dateFilter = { gte: (0, date_fns_1.sub)(now, { days: 7 }) };
                break;
            case period_filter_dto_1.PeriodFilter.LAST_30_DAYS:
                dateFilter = { gte: (0, date_fns_1.sub)(now, { days: 30 }) };
                break;
            case period_filter_dto_1.PeriodFilter.LAST_90_DAYS:
                dateFilter = { gte: (0, date_fns_1.sub)(now, { days: 90 }) };
                break;
            case period_filter_dto_1.PeriodFilter.THIS_YEAR:
                dateFilter = { gte: (0, date_fns_1.startOfYear)(now), lte: (0, date_fns_1.endOfYear)(now) };
                break;
            case period_filter_dto_1.PeriodFilter.CUSTOM:
                if (!startDate || !endDate) {
                    throw new common_1.BadRequestException('Pour une période personnalisée, les dates de début et de fin sont requises.');
                }
                dateFilter = { gte: new Date(startDate), lte: new Date(endDate) };
                break;
            case period_filter_dto_1.PeriodFilter.ALL_TIME:
            default:
                return {};
        }
        return { [dateField]: dateFilter };
    }
    async getPnlStatement(user, periodFilterDto) {
        const { subsidiaryId } = user;
        const dateFilter = this.getDateFilter(periodFilterDto, 'saleDate');
        const subsidiary = await this.prisma.subsidiary.findUnique({
            where: { id: subsidiaryId },
            select: { taxRate: true },
        });
        const taxRate = subsidiary?.taxRate ?? new client_1.Prisma.Decimal(0.3);
        const salesResult = await this.prisma.sale.aggregate({
            _sum: { totalPrice: true },
            where: { subsidiaryId, status: 'PAID', ...dateFilter },
        });
        const revenue = salesResult._sum.totalPrice ?? new client_1.Prisma.Decimal(0);
        const cogs = new client_1.Prisma.Decimal(0);
        const expensesResult = await this.prisma.expenseRecord.aggregate({
            _sum: { amount: true },
            where: {
                subsidiaryId,
                ...this.getDateFilter(periodFilterDto, 'expenseDate'),
            },
        });
        const operatingExpenses = expensesResult._sum.amount ?? new client_1.Prisma.Decimal(0);
        const grossProfit = revenue.sub(cogs);
        const taxes = grossProfit.gt(0)
            ? grossProfit.mul(taxRate)
            : new client_1.Prisma.Decimal(0);
        const netIncome = grossProfit.sub(operatingExpenses).sub(taxes);
        return {
            revenue: revenue.toNumber(),
            cogs: cogs.toNumber(),
            grossProfit: grossProfit.toNumber(),
            operatingExpenses: operatingExpenses.toNumber(),
            taxes: taxes.toNumber(),
            netIncome: netIncome.toNumber(),
        };
    }
    async getCrmAnalysis(user, periodFilterDto) {
        const { subsidiaryId } = user;
        const dateFilter = this.getDateFilter(periodFilterDto, 'closeDate');
        const opportunities = await this.prisma.opportunity.findMany({
            where: { subsidiaryId, ...dateFilter },
        });
        const pipelineValue = opportunities
            .filter((o) => o.stage !== client_1.OpportunityStage.WON && o.stage !== client_1.OpportunityStage.LOST)
            .reduce((sum, o) => sum.add(o.opportunityValue), new client_1.Prisma.Decimal(0));
        const wonCount = opportunities.filter((o) => o.stage === client_1.OpportunityStage.WON).length;
        const totalCount = opportunities.length;
        const conversionRate = totalCount > 0 ? (wonCount / totalCount) * 100 : 0;
        const newOpportunities = opportunities.length;
        const webOpportunities = opportunities.filter((o) => o.sourceOpportunity === 'WEB_ORDER').length;
        return {
            pipelineValue: pipelineValue.toNumber(),
            conversionRate,
            newOpportunities,
            webOpportunities,
        };
    }
};
exports.FinancesStatsService = FinancesStatsService;
exports.FinancesStatsService = FinancesStatsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FinancesStatsService);
//# sourceMappingURL=finances_stats.service.js.map