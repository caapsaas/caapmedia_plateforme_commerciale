import { PrismaService } from "../../common/utils/prisma/prisma.service";
import { PeriodFilterDto } from './dto/period-filter.dto';
import { Prisma, User } from '@prisma/client';
export declare class AnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getDateFilter;
    private resolveSubsidiaryId;
    getDashboardStats(user: User, periodFilterDto: PeriodFilterDto, requestedSubsidiaryId?: string): Promise<{
        totalSales: number;
        netRevenue: number;
        newCustomers: number;
        stockValue: number;
        salesPerformance: {
            date: string;
            sales: number;
        }[];
        stockDistribution: {};
        stockByCategory: {
            category: string;
            _sum: {
                stock: number;
            };
        }[];
    }>;
    getSalesAnalysis(user: User, periodFilterDto: PeriodFilterDto, requestedSubsidiaryId?: string): Promise<{
        totalRevenue: number;
        orderCount: number;
        cashSaleCount: number;
        averageBasket: number;
        topSellingProducts: (Prisma.PickEnumerable<Prisma.SaleGroupByOutputType, "productName"[]> & {
            _sum: {
                quantity: number;
                totalPrice: Prisma.Decimal;
            };
        })[];
        salesByCategory: {
            category: string;
            total: number;
        }[];
        topCustomers: {
            customerId: string;
            customerName: string;
            totalSpent: number;
        }[];
    }>;
    getPurchaseAnalysis(user: User, periodFilterDto: PeriodFilterDto, requestedSubsidiaryId?: string): Promise<{
        totalPurchaseValue: number;
        totalOrders: number;
        averageOrderValue: number;
        spendingBySupplier: {
            _sum: {
                totalAmount: number;
            };
            supplierName: string;
            supplierId: string;
        }[];
        topPurchasedProducts: (Prisma.PickEnumerable<Prisma.PurchaseOrderItemGroupByOutputType, ("productId" | "productName")[]> & {
            _sum: {
                quantity: number;
            };
        })[];
    }>;
}
