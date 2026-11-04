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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const period_filter_dto_1 = require("./dto/period-filter.dto");
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
const subsidiary_scope_1 = require("../../common/utils/subsidiary-scope");
const client_2 = require("@prisma/client");
let AnalyticsService = class AnalyticsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    getDateFilter(periodFilterDto) {
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
                dateFilter = {};
                break;
        }
        return dateFilter;
    }
    resolveSubsidiaryId(user, requestedSubsidiaryId) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(user, [client_2.UserRole.FINANCIAL_DIRECTOR]);
        return (0, subsidiary_scope_1.resolveEffectiveSubsidiaryId)(ctx, requestedSubsidiaryId);
    }
    async getDashboardStats(user, periodFilterDto, requestedSubsidiaryId) {
        const subsidiaryId = this.resolveSubsidiaryId(user, requestedSubsidiaryId);
        const subsidiaryFilter = subsidiaryId ? { subsidiaryId } : {};
        const dateFilter = this.getDateFilter(periodFilterDto);
        const where = {
            ...subsidiaryFilter,
            saleDate: dateFilter,
            status: 'PAID',
        };
        const totalSalesResult = await this.prisma.sale.aggregate({
            _sum: { totalPrice: true },
            where: where,
        });
        const totalSales = totalSalesResult._sum.totalPrice || new client_1.Prisma.Decimal(0);
        const netRevenue = totalSales;
        const newCustomersCount = await this.prisma.contact.count({
            where: { ...subsidiaryFilter, since: dateFilter },
        });
        const stockItemsWithLevels = await this.prisma.item.findMany({
            where: { type: 'STOCK_PRODUCT' },
            select: {
                category: true,
                stockLevels: {
                    where: subsidiaryId ? { subsidiaryId } : {},
                    select: { stock: true },
                },
            },
        });
        const categoryMap = new Map();
        for (const item of stockItemsWithLevels) {
            const cat = item.category || 'Non catégorisé';
            const current = categoryMap.get(cat) ?? { itemCount: 0, stockSum: 0 };
            current.itemCount += 1;
            current.stockSum += item.stockLevels.reduce((s, l) => s + Number(l.stock), 0);
            categoryMap.set(cat, current);
        }
        const hasRealStock = [...categoryMap.values()].some((v) => v.stockSum > 0);
        const stockByCategoryResult = [...categoryMap.entries()].map(([category, { itemCount, stockSum }]) => ({
            category,
            _sum: { stock: hasRealStock ? stockSum : itemCount },
        }));
        const stockValue = new client_1.Prisma.Decimal(0);
        const subsidiarySqlFilter = subsidiaryId
            ? client_1.Prisma.sql `"subsidiary_id" = ${subsidiaryId}`
            : client_1.Prisma.sql `TRUE`;
        const salesPerformance = await this
            .prisma.$queryRaw `
      SELECT
        TO_CHAR("sale_date", 'YYYY-MM-DD') as date,
        SUM("total_price")::float as sales
      FROM "sale"
      WHERE ${subsidiarySqlFilter}
        AND status = 'PAID'
        AND (${dateFilter.gte}::timestamp IS NULL OR "sale_date" >= ${dateFilter.gte}::timestamp)
        AND (${dateFilter.lte}::timestamp IS NULL OR "sale_date" <= ${dateFilter.lte}::timestamp)
      GROUP BY date
      ORDER BY date ASC;
    `;
        return {
            totalSales: totalSales.toNumber(),
            netRevenue: netRevenue.toNumber(),
            newCustomers: newCustomersCount,
            stockValue: stockValue.toNumber(),
            salesPerformance,
            stockDistribution: {},
            stockByCategory: stockByCategoryResult,
        };
    }
    async getSalesAnalysis(user, periodFilterDto, requestedSubsidiaryId) {
        const subsidiaryId = this.resolveSubsidiaryId(user, requestedSubsidiaryId);
        const subsidiaryFilter = subsidiaryId ? { subsidiaryId } : {};
        const dateFilter = this.getDateFilter(periodFilterDto);
        const where = {
            ...subsidiaryFilter,
            saleDate: dateFilter,
            status: 'PAID',
        };
        const totalRevenueResult = await this.prisma.sale.aggregate({
            _sum: { totalPrice: true },
            where: where,
        });
        const orderCount = await this.prisma.order.count({
            where: {
                ...subsidiaryFilter,
                orderDate: dateFilter,
            },
        });
        const cashSaleCount = await this.prisma.sale.count({
            where: { ...where, orderId: null },
        });
        const averageBasket = orderCount > 0
            ? (totalRevenueResult._sum.totalPrice || new client_1.Prisma.Decimal(0)).div(orderCount)
            : new client_1.Prisma.Decimal(0);
        const topSellingProducts = await this.prisma.sale.groupBy({
            by: ['productName'],
            _sum: { quantity: true, totalPrice: true },
            where: where,
            orderBy: { _sum: { quantity: 'desc' } },
            take: 5,
        });
        const subsidiarySqlFilter = subsidiaryId
            ? client_1.Prisma.sql `s.subsidiary_id = ${subsidiaryId}`
            : client_1.Prisma.sql `TRUE`;
        const salesByCategory = await this
            .prisma.$queryRaw `
      SELECT
        p.category as "category",
        SUM(s.total_price)::float as total
      FROM "sale" s -- Utilisation de LOWER() pour une jointure insensible à la casse
      JOIN "items" p ON LOWER(s.product_name) = LOWER(p.name)
      WHERE ${subsidiarySqlFilter}
        AND (${dateFilter.gte}::timestamp IS NULL OR s.sale_date >= ${dateFilter.gte}::timestamp)
        AND (${dateFilter.lte}::timestamp IS NULL OR s.sale_date <= ${dateFilter.lte}::timestamp)
      GROUP BY p.category
      ORDER BY total DESC;
    `;
        const topCustomers = await this.prisma.sale.groupBy({
            by: ['customerId', 'customerName'],
            where: where,
            _sum: {
                totalPrice: true,
            },
            orderBy: {
                _sum: {
                    totalPrice: 'desc',
                },
            },
            take: 5,
        });
        return {
            totalRevenue: totalRevenueResult._sum.totalPrice?.toNumber() ?? 0,
            orderCount,
            cashSaleCount,
            averageBasket: averageBasket.toNumber(),
            topSellingProducts,
            salesByCategory,
            topCustomers: topCustomers.map((c) => ({
                customerId: c.customerId,
                customerName: c.customerName,
                totalSpent: c._sum.totalPrice?.toNumber() ?? 0,
            })),
        };
    }
    async getPurchaseAnalysis(user, periodFilterDto, requestedSubsidiaryId) {
        const subsidiaryId = this.resolveSubsidiaryId(user, requestedSubsidiaryId);
        const subsidiaryFilter = subsidiaryId ? { subsidiaryId } : {};
        const dateFilter = this.getDateFilter(periodFilterDto);
        const where = {
            ...subsidiaryFilter,
            orderDate: dateFilter,
        };
        const totalPurchaseValueResult = await this.prisma.purchaseOrder.aggregate({
            _sum: { totalAmount: true },
            where,
        });
        const totalOrders = await this.prisma.purchaseOrder.count({ where });
        const averageOrderValue = totalOrders > 0
            ? (totalPurchaseValueResult._sum.totalAmount || new client_1.Prisma.Decimal(0)).div(totalOrders)
            : new client_1.Prisma.Decimal(0);
        const spendingBySupplier = await this.prisma.purchaseOrder.groupBy({
            by: ['supplierId', 'supplierName'],
            _sum: { totalAmount: true },
            where,
            orderBy: { _sum: { totalAmount: 'desc' } },
        });
        const topPurchasedProducts = await this.prisma.purchaseOrderItem.groupBy({
            by: ['productId', 'productName'],
            _sum: { quantity: true },
            where: { purchaseOrder: where },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 5,
        });
        return {
            totalPurchaseValue: totalPurchaseValueResult._sum.totalAmount?.toNumber() ?? 0,
            totalOrders,
            averageOrderValue: averageOrderValue.toNumber(),
            spendingBySupplier: spendingBySupplier.map((s) => ({
                ...s,
                _sum: { totalAmount: s._sum.totalAmount?.toNumber() ?? 0 },
            })),
            topPurchasedProducts,
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map