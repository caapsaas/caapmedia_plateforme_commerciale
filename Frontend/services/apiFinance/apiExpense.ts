import { api } from '../api';
import { ExpenseRecord } from '../../types';

/**
 * Données pour la création d'une charge.
 * Les champs gérés par le backend sont omis.
 */
export type ExpenseRecordCreationData = Omit<ExpenseRecord, 'id' | 'subsidiaryId'>;

/**
 * Données pour la mise à jour d'une charge.
 */
export type ExpenseRecordUpdateData = Partial<ExpenseRecordCreationData>;

/**
 * Récupère toutes les charges pour la filiale de l'utilisateur connecté.
 * Protégé par rôle (ADMIN, FINANCIAL_DIRECTOR, CAISSIER).
 */
export const getExpenses = async (): Promise<ExpenseRecord[]> => {
  const { data } = await api.get<ExpenseRecord[]>('/finance/expenses');
  return data;
};

/**
 * Récupère une charge spécifique par son ID.
 */
export const getExpenseById = async (id: string): Promise<ExpenseRecord> => {
  const { data } = await api.get<ExpenseRecord>(`/finance/expenses/${id}`);
  return data;
};

/**
 * Crée ou met à jour une charge.
 * Protégé par rôle (ADMIN, FINANCIAL_DIRECTOR).
 * @param expenseData - Les données de la charge.
 */
export const saveExpense = async (expenseData: Partial<ExpenseRecord>): Promise<ExpenseRecord> => {
  if (expenseData.id) {
    // Mise à jour
    const { data } = await api.patch<ExpenseRecord>(`/finance/expenses/${expenseData.id}`, expenseData);
    return data;
  } else {
    // Création
    const { data } = await api.post<ExpenseRecord>('/finance/expenses', expenseData);
    return data;
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
