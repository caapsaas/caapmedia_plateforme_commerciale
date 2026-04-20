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
  const { data } = await api.get<any[]>('/finance/expenses');
  // Mapper les champs du backend vers le frontend
  return data.map(expense => ({
    ...expense,
    date: expense.expenseDate, // expenseDate -> date
    type: expense.expenseRecordType, // expenseRecordType -> type
  }));
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
export const saveExpense = async (expenseData: Partial<ExpenseRecord>): Promise<ExpenseRecord> => {
  // Mapper les champs du frontend vers le backend
  const backendData = {
    description: expenseData.description,
    amount: expenseData.amount,
    category: expenseData.category,
    expenseRecordType: expenseData.type, // type -> expenseRecordType
    expenseDate: expenseData.date, // date -> expenseDate
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
