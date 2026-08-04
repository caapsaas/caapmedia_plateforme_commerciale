import { api } from '../api';
import { SupplierDebt, LongTermDebt } from '../../types';

// --- Types pour les Dettes Fournisseurs ---

/**
 * Données pour la création d'une dette fournisseur.
 */
export type SupplierDebtCreationData = Omit<SupplierDebt, 'id' | 'subsidiaryId' | 'status'>;

/**
 * Données pour le paiement d'une dette fournisseur.
 */
export interface SupplierDebtPaymentData {
  paymentDate: string; // YYYY-MM-DD
  treasuryAccountId: string;
}

// --- Types pour les Dettes à Long Terme ---

/**
 * Données pour la création d'une dette à long terme.
 */
export type LongTermDebtCreationData = Omit<LongTermDebt, 'id' | 'subsidiaryId' | 'currentBalance'>;

/**
 * Données pour la mise à jour d'une dette à long terme.
 */
export type LongTermDebtUpdateData = Partial<LongTermDebtCreationData>;


// ================================================================= //
//                         DETTES FOURNISSEURS                       //
// ================================================================= //

/**
 * Crée une nouvelle dette fournisseur.
 * Protégé par rôle (ADMIN, FINANCIAL_DIRECTOR, PURCHASING_MANAGER).
 * @param debtData - Les données de la dette à créer.
 */
export const createSupplierDebt = async (debtData: SupplierDebtCreationData): Promise<SupplierDebt> => {
  const { data } = await api.post<SupplierDebt>('/finance/debts/supplier', debtData);
  return data;
};

/**
 * Récupère toutes les dettes fournisseurs de la filiale.
 */
/**
 * Limit élevée pour préserver le comportement "tout charger" nécessaire à
 * l'export CSV/PDF de SupplierDebts.tsx.
 */
export const getSupplierDebts = async (): Promise<SupplierDebt[]> => {
  const { data } = await api.get<{ data: SupplierDebt[] }>('/finance/debts/supplier', { params: { limit: 500 } });
  return data.data;
};

/**
 * Marque une dette fournisseur comme payée et crée la transaction de dépense.
 * Protégé par rôle (ADMIN, FINANCIAL_DIRECTOR, CAISSIER).
 * @param id - L'ID de la dette à payer.
 * @param paymentData - Les informations sur le paiement.
 */
export const paySupplierDebt = async (id: string, paymentData: SupplierDebtPaymentData): Promise<SupplierDebt> => {
  const { data } = await api.post<SupplierDebt>(`/finance/debts/supplier/${id}/pay`, paymentData);
  return data;
};

// ================================================================= //
//                         DETTES À LONG TERME                       //
// ================================================================= //

/**
 * Crée une nouvelle dette à long terme.
 * Protégé par rôle (ADMIN, FINANCIAL_DIRECTOR).
 * @param debtData - Les données de la dette à créer.
 */
export const createLongTermDebt = async (debtData: LongTermDebtCreationData): Promise<LongTermDebt> => {
  const { data } = await api.post<LongTermDebt>('/finance/debts/long-term', debtData);
  return data;
};

/**
 * Récupère toutes les dettes à long terme de la filiale.
 */
export const getLongTermDebts = async (): Promise<LongTermDebt[]> => {
  const { data } = await api.get<{ data: LongTermDebt[] }>('/finance/debts/long-term', { params: { limit: 500 } });
  return data.data;
};

/**
 * Met à jour une dette à long terme.
 * Protégé par rôle (ADMIN, FINANCIAL_DIRECTOR).
 */
export const updateLongTermDebt = async (id: string, updateData: LongTermDebtUpdateData): Promise<LongTermDebt> => {
  const { data } = await api.patch<LongTermDebt>(`/finance/debts/long-term/${id}`, updateData);
  return data;
};
