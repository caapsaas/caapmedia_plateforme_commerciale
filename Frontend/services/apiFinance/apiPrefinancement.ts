import { api } from '../api';

// Types pour le préfinancement
export interface PrefinancementAccount {
    id: string;
    accountName: string;
    balance: number;
    currency: string;
    lastUpdated: string;
    subsidiaryId: string;
}

export interface PrefinancementTransaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'CREDIT' | 'DEBIT';
    category: 'MATERIELS_PREMIER' | 'MAIN_D_OEUVRE' | 'ENERGIE' | 'TRANSPORT' | 'AUTRE';
    status: 'VALIDE' | 'EN_ATTENTE' | 'ANNULE';
    referenceNumber?: string;
    relatedOrderId?: string;
    notes?: string;
    subsidiaryId: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    creator?: {
        id: string;
        userName: string;
        email: string;
    };
}

export interface PrefinancementStatistics {
    totalBalance: number;
    totalCredits: number;
    totalDebits: number;
    transactionCount: number;
    creditsByCategory: Array<{
        category: string;
        amount: number;
        count: number;
    }>;
    debitsByCategory: Array<{
        category: string;
        amount: number;
        count: number;
    }>;
}

export interface PrefinancementFilters {
    subsidiaryId?: string;
    type?: 'CREDIT' | 'DEBIT';
    category?: 'MATERIELS_PREMIER' | 'MAIN_D_OEUVRE' | 'ENERGIE' | 'TRANSPORT' | 'AUTRE';
    status?: 'VALIDE' | 'EN_ATTENTE' | 'ANNULE';
    startDate?: string;
    endDate?: string;
    search?: string;
}

// Types pour la création/mise à jour
export type PrefinancementTransactionCreationData = Omit<PrefinancementTransaction, 
    'id' | 'subsidiaryId' | 'createdBy' | 'createdAt' | 'updatedAt' | 'creator' | 'status'
>;

export type PrefinancementTransactionCreationWithSubsidiaryData = PrefinancementTransactionCreationData & {
    subsidiaryId: string;
};

export type PrefinancementTransactionUpdateData = Partial<Omit<PrefinancementTransaction, 
    'id' | 'subsidiaryId' | 'createdBy' | 'createdAt' | 'updatedAt' | 'creator'
>>;

// ================================================================= //
//                     COMPTE PRÉFINANCEMENT                      //
// ================================================================= //

/**
 * Récupère le compte de préfinancement de la filiale.
 * @param subsidiaryId - L'ID de la filiale (optionnel).
 */
export const getPrefinancementAccount = async (subsidiaryId?: string): Promise<PrefinancementAccount> => {
    const params = subsidiaryId ? { subsidiaryId } : {};
    const { data } = await api.get<PrefinancementAccount>('/finance/prefinancement/account', { params });
    return data;
};

/**
 * Crée ou met à jour le compte de préfinancement de la filiale.
 * @param accountData - Les données du compte.
 */
export const createOrUpdatePrefinancementAccount = async (accountData: {
    accountName: string;
    initialBalance?: number;
    subsidiaryId: string;
}): Promise<PrefinancementAccount> => {
    const { data } = await api.post<PrefinancementAccount>('/finance/prefinancement/account', accountData);
    return data;
};

// ================================================================= //
//                 TRANSACTIONS PRÉFINANCEMENT                //
// ================================================================= //

/**
 * Crée une nouvelle transaction de préfinancement.
 * @param transactionData - Les données de la transaction.
 */
export const createPrefinancementTransaction = async (transactionData: PrefinancementTransactionCreationData): Promise<PrefinancementTransaction> => {
    const { data } = await api.post<PrefinancementTransaction>('/finance/prefinancement/transactions', transactionData);
    return data;
};

/**
 * Récupère toutes les transactions de préfinancement.
 * @param filters - Filtres optionnels.
 */
export const getPrefinancementTransactions = async (filters?: PrefinancementFilters): Promise<PrefinancementTransaction[]> => {
    const { data } = await api.get<PrefinancementTransaction[]>('/finance/prefinancement/transactions', { params: filters || {} });
    return data;
};

/**
 * Récupère une transaction spécifique par son ID.
 * @param id - L'ID de la transaction.
 */
export const getPrefinancementTransactionById = async (id: string): Promise<PrefinancementTransaction> => {
    const { data } = await api.get<PrefinancementTransaction>(`/finance/prefinancement/transactions/${id}`);
    return data;
};

/**
 * Met à jour une transaction de préfinancement.
 * @param id - L'ID de la transaction.
 * @param transactionData - Les données à mettre à jour.
 */
export const updatePrefinancementTransaction = async (id: string, transactionData: PrefinancementTransactionUpdateData): Promise<PrefinancementTransaction> => {
    const { data } = await api.patch<PrefinancementTransaction>(`/finance/prefinancement/transactions/${id}`, transactionData);
    return data;
};

/**
 * Valide une transaction de préfinancement.
 * @param id - L'ID de la transaction à valider.
 */
export const validatePrefinancementTransaction = async (id: string): Promise<PrefinancementTransaction> => {
    const { data } = await api.patch<PrefinancementTransaction>(`/finance/prefinancement/transactions/${id}/validate`);
    return data;
};

/**
 * Annule une transaction de préfinancement.
 * @param id - L'ID de la transaction à annuler.
 */
export const cancelPrefinancementTransaction = async (id: string): Promise<PrefinancementTransaction> => {
    const { data } = await api.patch<PrefinancementTransaction>(`/finance/prefinancement/transactions/${id}/cancel`);
    return data;
};

/**
 * Supprime une transaction de préfinancement.
 * @param id - L'ID de la transaction à supprimer.
 */
export const deletePrefinancementTransaction = async (id: string): Promise<void> => {
    await api.delete(`/finance/prefinancement/transactions/${id}`);
};

/**
 * Récupère les statistiques de préfinancement.
 * @param subsidiaryId - L'ID de la filiale.
 */
export const getPrefinancementStatistics = async (subsidiaryId?: string): Promise<PrefinancementStatistics> => {
    const params = subsidiaryId ? { subsidiaryId } : {};
    const { data } = await api.get<PrefinancementStatistics>('/finance/prefinancement/statistics', { params });
    return data;
};
