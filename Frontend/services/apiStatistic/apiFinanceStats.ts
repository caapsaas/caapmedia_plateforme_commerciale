import { api } from '../api';
import { PeriodFilterDto } from './apiAnalytics';

/**
 * Statistiques sur les créances clients.
 */
export interface CustomerReceivablesStats {
    totalReceivables: number;
}

/**
 * Statistiques sur les dettes fournisseurs.
 */
export interface SupplierDebtsStats {
    totalDebts: number;
}

/**
 * Rapport Cash-Flow (trésorerie réelle & encours).
 */
export interface CashflowReport {
    totalCashPosition: number;
    balancesByType: {
        cashRegister: number;
        safe: number;
        bank: number;
        expenseBox: number;
        prefinancement: number;
    };
    period: {
        inflows: number;
        outflows: number;
        netCashflow: number;
        internalTransfers: number;
        bankFees: number;
    };
    pending: {
        pendingInflows: number;
        pendingOutflows: number;
        customerReceivables: number;
        supplierDebts: number;
    };
    monthlySeries: Array<{
        month: string;
        inflows: number;
        outflows: number;
    }>;
}

/**
 * Rapport Rentabilité Opérationnelle.
 */
export interface ProfitabilityReport {
    invoicedRevenue: number;
    collectedRevenue: number;
    ledgerRevenue: number;
    collectionRate: number;
    purchaseCosts: number;
    operatingExpenses: number;
    payrollCosts: number;
    grossMargin: number;
    netOperatingResult: number;
    marginRate: number;
    expenseBreakdown: Array<{ category: string; amount: number }>;
}

/**
 * Analyse CRM.
 */
export interface CrmAnalysis {
    pipelineValue: number;
    conversionRate: number;
    newOpportunities: number;
    webOpportunities: number;
}

// --- API Functions ---

/**
 * Récupère le solde des créances clients.
 * @param query - Le filtre de période.
 */
export const getCustomerReceivables = async (query: PeriodFilterDto): Promise<CustomerReceivablesStats> => {
    const { data } = await api.get<CustomerReceivablesStats>('/finances-stats/customer-receivables', { params: query });
    return data;
};

/**
 * Récupère le solde des dettes fournisseurs.
 * @param query - Le filtre de période.
 */
export const getSupplierDebts = async (query: PeriodFilterDto): Promise<SupplierDebtsStats> => {
    const params: any = { ...query };
    const { data } = await api.get<SupplierDebtsStats>('/finances-stats/supplier-debts', { params });
    return data;
};

/**
 * Récupère le tableau de pilotage Cash-Flow.
 */
export const getCashflowReport = async (
    query: { period?: string; startDate?: string; endDate?: string },
    subsidiaryId?: string,
): Promise<CashflowReport> => {
    const params: Record<string, unknown> = { ...query };
    if (subsidiaryId) {
        params.subsidiaryId = subsidiaryId;
    }
    const { data } = await api.get<CashflowReport>('/finances-stats/cashflow', { params });
    return data;
};

/**
 * Récupère l'analyse de rentabilité opérationnelle.
 */
export const getProfitabilityReport = async (
    query: { period?: string; startDate?: string; endDate?: string },
    subsidiaryId?: string,
): Promise<ProfitabilityReport> => {
    const params: Record<string, unknown> = { ...query };
    if (subsidiaryId) {
        params.subsidiaryId = subsidiaryId;
    }
    const { data } = await api.get<ProfitabilityReport>('/finances-stats/profitability', { params });
    return data;
};

/**
 * Récupère l'analyse CRM.
 * @param query - Le filtre de période.
 */
export const getCrmAnalysis = async (query: PeriodFilterDto): Promise<CrmAnalysis> => {
    const { data } = await api.get<CrmAnalysis>('/finances-stats/crm-analysis', { params: query });
    return data;
};