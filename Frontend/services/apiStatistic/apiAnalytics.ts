import { api } from '../api';

/**
 * Périodes de filtrage disponibles - valeurs (pas les clés) de l'enum
 * PeriodFilter du backend (backend/src/statistics/analytics/dto/period-filter.dto.ts),
 * validees via class-validator @IsEnum: doivent matcher exactement, en
 * minuscules ('all_time', pas 'ALL_TIME').
 */
export type PeriodFilter = 'all_time' | 'this_month' | 'last_month' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'this_year' | 'custom';

/**
 * DTO pour le filtrage par période.
 * Correspond à PeriodFilterDto du backend.
 */
export interface PeriodFilterDto {
    period: PeriodFilter;
    startDate?: string; // ISO Date string
    endDate?: string;   // ISO Date string
}

// --- Interfaces for Return Types ---

export interface SalesPerformanceData {
    date: string;
    sales: number;
}

export interface StockByCategoryData {
    category: string;
    _sum: {
        stock: number | null;
    };
}

export interface DashboardStats {
    totalSales: number;
    netRevenue: number;
    newCustomers: number;
    stockValue: number;
    salesPerformance: SalesPerformanceData[];
    stockDistribution: Record<string, number>;
    stockByCategory: StockByCategoryData[];
}

export interface TopSellingProduct {
    productName: string;
    _sum: {
        quantity: number | null;
        totalPrice: number | null;
    };
}

export interface SalesByCategory {
    category: string;
    total: number;
}

export interface TopCustomer {
    customerId: string;
    customerName: string;
    totalSpent: number;
}

export interface SalesAnalysis {
    totalRevenue: number;
    orderCount: number;
    cashSaleCount: number;
    averageBasket: number;
    topSellingProducts: TopSellingProduct[];
    salesByCategory: SalesByCategory[];
    topCustomers: TopCustomer[];
}

export interface SpendingBySupplier {
    supplierId: string;
    supplierName: string;
    _sum: {
        totalAmount: number;
    };
}

export interface TopPurchasedProduct {
    productId: string;
    productName: string;
    _sum: {
        quantity: number | null;
    };
}

export interface PurchaseAnalysis {
    totalPurchaseValue: number;
    totalOrders: number;
    averageOrderValue: number;
    spendingBySupplier: SpendingBySupplier[];
    topPurchasedProducts: TopPurchasedProduct[];
}

// --- API Functions ---

/**
 * Récupère les statistiques du tableau de bord.
 * @param subsidiaryId Filiale ciblée (drill-down). Ignoré par le backend si
 * l'utilisateur n'a pas de scope global (SUPER_ADMIN/FINANCIAL_DIRECTOR) -
 * omis ou vide, un utilisateur à scope global obtient la vue consolidée.
 */
export const getDashboardStats = async (query: PeriodFilterDto, subsidiaryId?: string): Promise<DashboardStats> => {
    const { data } = await api.get<DashboardStats>('/analytics/dashboard', { params: { ...query, subsidiaryId } });
    return data;
};

/**
 * Récupère l'analyse des ventes.
 */
export const getSalesAnalysis = async (query: PeriodFilterDto): Promise<SalesAnalysis> => {
    const { data } = await api.get<SalesAnalysis>('/analytics/sales', { params: query });
    return data;
};

/**
 * Récupère l'analyse des achats.
 */
export const getPurchaseAnalysis = async (query: PeriodFilterDto): Promise<PurchaseAnalysis> => {
    const { data } = await api.get<PurchaseAnalysis>('/analytics/purchases', { params: query });
    return data;
};