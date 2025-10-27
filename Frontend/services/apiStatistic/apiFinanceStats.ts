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
 * Compte de résultat (Profit and Loss).
 */
export interface PnlStatement {
    revenue: number;
    cogs: number;
    grossProfit: number;
    operatingExpenses: number;
    taxes: number;
    netIncome: number;
}

/**
 * Bilan comptable.
 */
export interface BalanceSheet {
    assets: {
        treasury: number;
        customerReceivables: number;
        inventory: number;
        equipments: number;
        fixedAssets: number;
    };
    totalAssets: number;
    liabilities: {
        supplierDebts: number;
        shareCapital: number;
        netIncome: number;
    };
    totalLiabilities: number;
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
    const { data } = await api.get<SupplierDebtsStats>('/finances-stats/supplier-debts', { params: query });
    return data;
};

/**
 * Récupère le compte de résultat (P&L).
 * @param query - Le filtre de période.
 */
export const getPnlStatement = async (query: PeriodFilterDto): Promise<PnlStatement> => {
    const { data } = await api.get<PnlStatement>('/finances-stats/pnl-statement', { params: query });
    return data;
};

/**
 * Récupère le bilan comptable.
 */
export const getBalanceSheet = async (): Promise<BalanceSheet> => {
    const { data } = await api.get<BalanceSheet>('/finances-stats/balance-sheet');
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