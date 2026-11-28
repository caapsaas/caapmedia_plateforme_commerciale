import { api } from '../api';
import { ExpenseRecord } from '../../types';
import { PaginatedResponse } from '../../types/pagination.types';

/**
 * Données pour la création d'une charge.
 * Les champs gérés par le backend sont omis.
 */
export type ExpenseRecordCreationData = Omit<ExpenseRecord, 'id' | 'subsidiaryId' | 'paymentTransaction'>;

/**
 * Données pour la mise à jour d'une charge.
 */
export type ExpenseRecordUpdateData = Partial<ExpenseRecordCreationData>;

/**
 * Récupère toutes les charges pour la filiale de l'utilisateur connecté.
 * Charge toutes les pages pour les filtres, le total et les exports CSV/PDF.
 */
export const getExpenses = async (subsidiaryId?: string, signal?: AbortSignal): Promise<ExpenseRecord[]> => {
  type ApiExpense = Omit<ExpenseRecord, 'date' | 'type'> & {
    expenseDate: ExpenseRecord['date'];
    expenseRecordType: ExpenseRecord['type'];
  };

  const expenses: ExpenseRecord[] = [];
  let page = 1;
  let hasNextPage: boolean;
  do {
    const { data } = await api.get<PaginatedResponse<ApiExpense>>('/finance/expenses', {
      params: { page, limit: 500, subsidiaryId },
      signal,
    });
    expenses.push(...data.data.map(expense => ({
      ...expense,
      date: expense.expenseDate,
      type: expense.expenseRecordType,
    })));
    hasNextPage = data.meta.hasNextPage;
    page += 1;
  } while (hasNextPage);

  return expenses;
};

export interface PayableExpense {
  id: string;
  description: string;
  amount: string;
  expenseDate: string;
  status?: string;
  subsidiary: { subsidiaryName: string };
}

export const getPayableExpenses = async (search: string): Promise<PayableExpense[]> => {
  const { data } = await api.get<{ data: PayableExpense[] }>('/finance/expenses/payable', { params: { limit: 100, search } });
  return data.data;
};

export const payExpense = async (id: string, payment: {
  safeId?: string;
  accountId?: string;
  expectedAmount: number;
  transactionDate: string;
  reference?: string;
}): Promise<void> => {
  await api.post(`/finance/expenses/${id}/pay`, payment);
};

export const uploadExpenseProof = async (id: string, file: File): Promise<ExpenseRecord> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<ExpenseRecord>(`/finance/expenses/${id}/proof`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const confirmExpenseInvoice = async (
  id: string,
  payload: { amount: number; description?: string; expenseDate?: string },
): Promise<ExpenseRecord> => {
  const { data } = await api.patch<ExpenseRecord>(`/finance/expenses/${id}/confirm-invoice`, payload);
  return data;
};

export const approveExpense = async (id: string): Promise<ExpenseRecord> => {
  const { data } = await api.patch<ExpenseRecord>(`/finance/expenses/${id}/approve`);
  return data;
};

export const rejectExpense = async (id: string, reason: string): Promise<ExpenseRecord> => {
  const { data } = await api.patch<ExpenseRecord>(`/finance/expenses/${id}/reject`, { reason });
  return data;
};

/**
 * Récupère une charge spécifique par son ID.
 */
export const getExpenseById = async (id: string): Promise<ExpenseRecord> => {
  const { data } = await api.get<any>(`/finance/expenses/${id}`);
  // Mapper les champs du backend vers le frontend
  return {
    ...data,
    date: data.expenseDate, // expenseDate -> date
    type: data.expenseRecordType, // expenseRecordType -> type
  };
};

/**
 * Crée ou met à jour une charge.
 * Protégé par rôle (ADMIN, FINANCIAL_DIRECTOR).
 * @param expenseData - Les données de la charge.
 */
export const saveExpense = async (
  expenseData: Partial<ExpenseRecord> & { isPendingInvoice?: boolean },
): Promise<ExpenseRecord> => {
  // Mapper les champs du frontend vers le backend
  const backendData = {
    description: expenseData.description,
    amount: expenseData.amount,
    category: expenseData.category,
    expenseRecordType: expenseData.type, // type -> expenseRecordType
    expenseDate: expenseData.date, // date -> expenseDate
    ...(expenseData.isPendingInvoice !== undefined
      ? { isPendingInvoice: expenseData.isPendingInvoice }
      : {}),
  };

  if (expenseData.id) {
    // Mise à jour
    const { data } = await api.patch<any>(`/finance/expenses/${expenseData.id}`, backendData);
    // Mapper les champs du backend vers le frontend
    return {
      ...data,
      date: data.expenseDate, // expenseDate -> date
      type: data.expenseRecordType, // expenseRecordType -> type
    };
  } else {
    // Création
    const { data } = await api.post<any>('/finance/expenses', backendData);
    // Mapper les champs du backend vers le frontend
    return {
      ...data,
      date: data.expenseDate, // expenseDate -> date
      type: data.expenseRecordType, // expenseRecordType -> type
    };
  }
};

/**
 * Supprime une charge par son ID.
 * Protégé par rôle (ADMIN, FINANCIAL_DIRECTOR).
 * @param id - L'ID de la charge à supprimer.
 */
export const deleteExpense = async (id: string): Promise<ExpenseRecord> => {
  const { data } = await api.delete<ExpenseRecord>(`/finance/expenses/${id}`);
  return data;
};
