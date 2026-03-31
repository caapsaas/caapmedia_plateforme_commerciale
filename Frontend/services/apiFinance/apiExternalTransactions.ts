import { api } from '../api';
import { ExternalFinancialTransaction, ExternalTransactionType, ExternalTransactionCategory, ExternalTransactionStatus, PaymentMethod } from '../../types/models';

export interface CreateExternalTransactionData {
  transactionDate: string;
  description: string;
  amount: number;
  externalTransactionType: ExternalTransactionType;
  externalTransactionCategory: ExternalTransactionCategory;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  createdBy: string;
  subsidiaryId: string;
}

export interface UpdateExternalTransactionData extends Partial<CreateExternalTransactionData> {
  status?: ExternalTransactionStatus;
}

export interface ExternalTransactionFilters {
  type?: string;
  category?: string;
  status?: ExternalTransactionStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface ExternalTransactionStatistics {
  totalTransactions: number;
  totalAmount: number;
  transactionsByType: Array<{
    type: ExternalTransactionType;
    count: number;
    amount: number;
  }>;
  transactionsByCategory: Array<{
    category: ExternalTransactionCategory;
    count: number;
    amount: number;
  }>;
  transactionsByStatus: Array<{
    status: ExternalTransactionStatus;
    count: number;
  }>;
  recentTransactions: Array<{
    id: string;
    description: string;
    amount: number;
    transactionDate: string;
    externalTransactionType: ExternalTransactionType;
    status: ExternalTransactionStatus;
  }>;
}

// Créer une nouvelle transaction externe
export const createExternalTransaction = async (data: CreateExternalTransactionData): Promise<ExternalFinancialTransaction> => {
  try {
    const { data: response } = await api.post<ExternalFinancialTransaction>('/finance/external-transactions', data);
    return response;
  } catch (error: any) {
    console.error('Error creating external transaction:', error);
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
    }
    throw error;
  }
};

// Récupérer toutes les transactions externes
export const getExternalTransactions = async (
  subsidiaryId: string, 
  filters?: ExternalTransactionFilters
): Promise<ExternalFinancialTransaction[]> => {
  try {
    const params: any = { subsidiaryId };
    
    if (filters?.type) params.type = filters.type;
    if (filters?.category) params.category = filters.category;
    if (filters?.status) params.status = filters.status;
    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;
    if (filters?.search) params.search = filters.search;

    const { data: response } = await api.get<ExternalFinancialTransaction[]>('/finance/external-transactions', { params });
    return response;
  } catch (error) {
    console.error('Error fetching external transactions:', error);
    throw error;
  }
};

// Récupérer une transaction externe par ID
export const getExternalTransactionById = async (id: string): Promise<ExternalFinancialTransaction> => {
  try {
    const { data: response } = await api.get<ExternalFinancialTransaction>(`/finance/external-transactions/${id}`);
    return response;
  } catch (error) {
    console.error('Error fetching external transaction:', error);
    throw error;
  }
};

// Mettre à jour une transaction externe
export const updateExternalTransaction = async (
  id: string, 
  data: UpdateExternalTransactionData
): Promise<ExternalFinancialTransaction> => {
  try {
    const { data: response } = await api.patch<ExternalFinancialTransaction>(`/finance/external-transactions/${id}`, data);
    return response;
  } catch (error) {
    console.error('Error updating external transaction:', error);
    throw error;
  }
};

// Valider une transaction externe
export const validateExternalTransaction = async (id: string): Promise<ExternalFinancialTransaction> => {
  try {
    const { data: response } = await api.patch<ExternalFinancialTransaction>(`/finance/external-transactions/${id}/validate`);
    return response;
  } catch (error) {
    console.error('Error validating external transaction:', error);
    throw error;
  }
};

// Annuler une transaction externe
export const cancelExternalTransaction = async (id: string): Promise<ExternalFinancialTransaction> => {
  try {
    const { data: response } = await api.patch<ExternalFinancialTransaction>(`/finance/external-transactions/${id}/cancel`);
    return response;
  } catch (error) {
    console.error('Error cancelling external transaction:', error);
    throw error;
  }
};

// Supprimer une transaction externe
export const deleteExternalTransaction = async (id: string): Promise<{ message: string }> => {
  try {
    const { data: response } = await api.delete<{ message: string }>(`/finance/external-transactions/${id}`);
    return response;
  } catch (error) {
    console.error('Error deleting external transaction:', error);
    throw error;
  }
};

// Récupérer les statistiques des transactions externes
export const getExternalTransactionStatistics = async (subsidiaryId: string): Promise<ExternalTransactionStatistics> => {
  try {
    const { data: response } = await api.get<ExternalTransactionStatistics>('/finance/external-transactions/statistics', { 
      params: { subsidiaryId } 
    });
    return response;
  } catch (error) {
    console.error('Error fetching external transaction statistics:', error);
    throw error;
  }
};
