import { api } from '../api';
import { TreasuryAccount, FinancialTransaction, TransactionStatus } from '../../types';

// --- Types pour les Comptes de Trésorerie ---

/**
 * Données pour la création d'un compte de trésorerie.
 * Les champs gérés par le backend sont omis.
 */
export type TreasuryAccountCreationData = Omit<TreasuryAccount, 'id' | 'subsidiaryId' | 'balance'> & {
  initialBalance: number;
};

// --- Types pour les Transactions Financières ---

/**
 * Données de base pour la création d'une transaction.
 * Le type de transaction (RECETTE/DEPENSE) est géré par la fonction appelée.
 */
export type TransactionCreationData = Omit<FinancialTransaction, 'id' | 'subsidiaryId' | 'financialTransactionType'>;

/**
 * Données pour la mise à jour du statut d'une transaction.
 */
export interface TransactionStatusUpdateData {
  status: TransactionStatus;
}

// ================================================================= //
//                       COMPTES DE TRÉSORERIE                       //
// ================================================================= //

/**
 * Crée un nouveau compte de trésorerie.
 * Protégé par rôle (ADMIN, FINANCIAL_DIRECTOR).
 * @param accountData - Les données du compte à créer.
 */
export const createTreasuryAccount = async (accountData: TreasuryAccountCreationData): Promise<TreasuryAccount> => {
  const { data } = await api.post<TreasuryAccount>('/finance/treasury/accounts', accountData);
  return data;
};

/**
 * Récupère tous les comptes de trésorerie de la filiale.
 */
export const getTreasuryAccounts = async (): Promise<TreasuryAccount[]> => {
  const { data } = await api.get<TreasuryAccount[]>('/finance/treasury/accounts');
  return data;
};

// ================================================================= //
//                     TRANSACTIONS FINANCIÈRES                      //
// ================================================================= //

/**
 * Crée une nouvelle transaction de recette.
 * Protégé par rôle (ADMIN, FINANCIAL_DIRECTOR, CAISSIER).
 * @param incomeData - Les données de la recette.
 */
export const createIncomeTransaction = async (incomeData: TransactionCreationData): Promise<FinancialTransaction> => {
  const { data } = await api.post<FinancialTransaction>('/finance/treasury/incomes', incomeData);
  return data;
};

/**
 * Crée une nouvelle transaction de dépense.
 * Protégé par rôle (ADMIN, FINANCIAL_DIRECTOR, CAISSIER).
 * @param expenseData - Les données de la dépense.
 */
export const createExpenseTransaction = async (expenseData: TransactionCreationData): Promise<FinancialTransaction> => {
  const { data } = await api.post<FinancialTransaction>('/finance/treasury/expenses', expenseData);
  return data;
};

/**
 * Récupère toutes les transactions financières de la filiale.
 */
export const getFinancialTransactions = async (): Promise<FinancialTransaction[]> => {
  const { data } = await api.get<FinancialTransaction[]>('/finance/treasury/transactions');
  return data;
};

/**
 * Met à jour le statut d'une transaction.
 * Protégé par rôle (ADMIN, FINANCIAL_DIRECTOR).
 * @param id - L'ID de la transaction.
 * @param statusData - Le nouveau statut.
 */
export const updateTransactionStatus = async (id: string, statusData: TransactionStatusUpdateData): Promise<FinancialTransaction> => {
  const { data } = await api.patch<FinancialTransaction>(`/finance/treasury/transactions/${id}/status`, statusData);
  return data;
};
