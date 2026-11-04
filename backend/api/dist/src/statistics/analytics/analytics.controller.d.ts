import { AnalyticsService } from './analytics.service';
import { PeriodFilterDto } from './dto/period-filter.dto';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getDashboardStats(req: any, periodFilterDto: PeriodFilterDto, subsidiaryId?: string): Promise<{
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
    getSalesAnalysis(req: any, periodFilterDto: PeriodFilterDto, subsidiaryId?: string): Promise<{
        totalRevenue: number;
        orderCount: number;
        cashSaleCount: number;
        averageBasket: number;
        topSellingProducts: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.SaleGroupByOutputType, "productName"[]> & {
            _sum: {
                quantity: number;
                totalPrice: import("@prisma/client/runtime/library").Decimal;
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
    getPurchaseAnalysis(req: any, periodFilterDto: PeriodFilterDto, subsidiaryId?: string): Promise<{
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
        topPurchasedProducts: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.PurchaseOrderItemGroupByOutputType, ("productId" | "productName")[]> & {
            _sum: {
                quantity: number;
            };
        })[];
    }>;
}
