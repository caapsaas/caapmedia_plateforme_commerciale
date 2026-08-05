import { api } from '../api';
import {
  TreasuryAccount,
  FinancialTransaction,
  TreasuryTransactionType,
  TransactionStatus,
  CounterpartyType,
  Counterparty,
} from '../../types';
import { PaginatedResponse, PaginationParams } from '../../types/pagination.types';

// --- Décaissement typé (Coffre-fort / Banque / Caisse dépense) + virement ---

export interface CreateDisbursementData {
  transactionDate: string;
  description: string;
  amount: number;
  sourceAccountId: string;
  destinationAccountId?: string;
  treasuryType: TreasuryTransactionType;
  reference?: string;
  counterpartyId?: string;
  newCounterpartyName?: string;
  newCounterpartyType?: CounterpartyType;
  status?: TransactionStatus;
}

// --- Types pour les Comptes de Trésorerie ---

/**
 * Données pour la création d'un compte de trésorerie.
 * Les champs gérés par le backend sont omis.
 */
export type TreasuryAccountCreationData = Omit<TreasuryAccount, 'id' | 'subsidiaryId' | 'balance'> & {
  initialBalance: number;
};

/**
 * Données pour la mise à jour d'un compte de trésorerie.
 */
export type TreasuryAccountUpdateData = Partial<Omit<TreasuryAccount, 'id' | 'subsidiaryId' | 'balance'>>;

// --- Types pour les Transactions Financières ---

/**
 * Données de base pour la création d'une transaction.
 * Le type de transaction (RECETTE/DEPENSE) est géré par la fonction appelée.
 */
export type TransactionCreationData = Omit<FinancialTransaction, 'id' | 'subsidiaryId' | 'financialTransactionType'>;


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
export const getTreasuryAccounts = async (subsidiaryId?: string): Promise<TreasuryAccount[]> => {
  const params = subsidiaryId ? { subsidiaryId } : {};
  const { data } = await api.get<TreasuryAccount[]>('/finance/treasury/accounts', { params });
  return data;
};

/**
 * Récupère un compte de trésorerie spécifique par son ID.
 * @param id - L'ID du compte à récupérer.
 */
export const getTreasuryAccountById = async (id: string): Promise<TreasuryAccount> => {
  const { data } = await api.get<TreasuryAccount>(`/finance/treasury/accounts/${id}`);
  return data;
};

/**
 * Met à jour un compte de trésorerie.
 * Protégé par rôle (ADMIN, FINANCIAL_DIRECTOR).
 * @param id - L'ID du compte à mettre à jour.
 * @param accountData - Les données à mettre à jour.
 */
export const updateTreasuryAccount = async (id: string, accountData: TreasuryAccountUpdateData): Promise<TreasuryAccount> => {
  const { data } = await api.patch<TreasuryAccount>(`/finance/treasury/accounts/${id}`, accountData);
  return data;
};

/**
 * Supprime un compte de trésorerie.
 * Protégé par rôle (ADMIN, FINANCIAL_DIRECTOR).
 * La suppression n'est possible que si le solde est à zéro et qu'il n'y a pas de transactions.
 * @param id - L'ID du compte à supprimer.
 * @returns Le compte qui a été supprimé.
 */
export const deleteTreasuryAccount = async (id: string): Promise<TreasuryAccount> => {
  const { data } = await api.delete<TreasuryAccount>(`/finance/treasury/accounts/${id}`);
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
  // S'assurer que les données sont correctement formatées pour le backend
  const processedData = {
    transactionDate: incomeData.transactionDate,
    description: incomeData.description,
    amount: Number(incomeData.amount), // S'assurer que c'est un nombre
    treasuryAccountId: incomeData.treasuryAccountId,
    relatedDocumentId: incomeData.relatedDocumentId || undefined,
    providerName: incomeData.providerName || undefined,
    providerPhone: incomeData.providerPhone || undefined
  };
  
  console.log('Données envoyées pour recette:', processedData);
  
  const { data } = await api.post<FinancialTransaction>('/finance/treasury/incomes', processedData);
  return data;
};

/**
 * Crée une nouvelle transaction de dépense.
 * Protégé par rôle (ADMIN, FINANCIAL_DIRECTOR, CAISSIER).
 * @param expenseData - Les données de la dépense.
 */
export const createExpenseTransaction = async (expenseData: TransactionCreationData): Promise<FinancialTransaction> => {
  // S'assurer que les données sont correctement formatées pour le backend
  const processedData = {
    transactionDate: expenseData.transactionDate,
    description: expenseData.description,
    amount: Number(expenseData.amount), // S'assurer que c'est un nombre
    treasuryAccountId: expenseData.treasuryAccountId,
    relatedDocumentId: expenseData.relatedDocumentId || undefined,
    providerName: expenseData.providerName || undefined,
    providerPhone: expenseData.providerPhone || undefined
  };
  
  console.log('Données envoyées pour dépense:', processedData);
  
  const { data } = await api.post<FinancialTransaction>('/finance/treasury/expenses', processedData);
  return data;
};

/**
 * Décaissement typé (coffre-fort/banque/caisse dépense) ou virement inter-
 * comptes (retrait coffre→banque, alimentation coffre→caisse dépense).
 * Protégé par rôle (ADMIN, FINANCIAL_DIRECTOR, CAISSIER).
 */
export const createDisbursement = async (
  disbursementData: CreateDisbursementData,
): Promise<FinancialTransaction> => {
  const { data } = await api.post<FinancialTransaction>(
    '/finance/treasury/disbursement',
    disbursementData,
  );
  return data;
};

/**
 * Valide (VALIDE) une transaction créée EN_ATTENTE — applique le débit/
 * crédit et pose l'écriture comptable. Protégé par rôle (ADMIN, FINANCIAL_DIRECTOR).
 */
export const updateTransactionStatus = async (
  id: string,
  status: TransactionStatus,
): Promise<FinancialTransaction> => {
  const { data } = await api.patch<FinancialTransaction>(
    `/finance/treasury/transaction/${id}/status`,
    { status },
  );
  return data;
};

export interface CashierOption {
  id: string;
  userName: string;
  email: string;
}

/**
 * Utilisateurs éligibles comme caissier assigné (Configuration Trésorerie —
 * comptes CAISSE/CASH_REGISTER/EXPENSE_BOX).
 */
export const getEligibleCashiers = async (): Promise<CashierOption[]> => {
  const { data } = await api.get<CashierOption[]>('/finance/treasury/cashiers');
  return data;
};

/**
 * Récupère les tiers (contreparties) de la filiale — fournisseurs, autorités
 * fiscales, etc. — utilisés par le décaissement typé.
 */
export const getCounterparties = async (type?: CounterpartyType): Promise<Counterparty[]> => {
  const { data } = await api.get<Counterparty[]>('/finance/treasury/counterparties', {
    params: type ? { type } : {},
  });
  return data;
};

/**
 * Récupère toutes les transactions financières de la filiale.
 */
/**
 * Récupère les transactions financières. Limit élevée pour préserver le
 * comportement "tout charger" nécessaire à l'export CSV/PDF de
 * TreasuryManagement.tsx.
 */
export const getFinancialTransactions = async (subsidiaryId?: string): Promise<FinancialTransaction[]> => {
  const params = { ...(subsidiaryId ? { subsidiaryId } : {}), limit: 1000 };
  const { data } = await api.get<PaginatedResponse<FinancialTransaction>>(
    '/finance/treasury/transactions',
    { params },
  );
  return data.data;
};

/**
 * Version paginée/recherchable (page/limit/search) pour un futur usage en
 * pagination cliquable réelle.
 */
export const getFinancialTransactionsPaginated = async (
  params: PaginationParams & { subsidiaryId?: string },
): Promise<PaginatedResponse<FinancialTransaction>> => {
  const { data } = await api.get<PaginatedResponse<FinancialTransaction>>(
    '/finance/treasury/transactions',
    { params },
  );
  return data;
};

/**
 * Supprime une transaction financière.
 * Protégé par rôle (ADMIN, FINANCIAL_DIRECTOR).
 * @param id - L'ID de la transaction à supprimer.
 * @returns La transaction qui a été supprimée.
 */
export const deleteTransaction = async (id: string): Promise<FinancialTransaction> => {
  const { data } = await api.delete<FinancialTransaction>(`/finance/treasury/transactions/${id}`);
  return data;
};

/**
 * Historique paginé d'UN compte (source ou destination), enrichi des noms de
 * compte/contrepartie et du solde après chaque mouvement — utilisé par
 * AccountHistoryModal.
 */
export const getAccountTransactions = async (
  accountId: string,
  params: PaginationParams & { startDate?: string; endDate?: string } = {},
): Promise<PaginatedResponse<FinancialTransaction>> => {
  const { data } = await api.get<PaginatedResponse<FinancialTransaction>>(
    `/finance/treasury/accounts/${accountId}/transactions`,
    { params },
  );
  return data;
};

