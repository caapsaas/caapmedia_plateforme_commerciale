import { api } from '../api';
import { Bank, BankType } from '../../types';

/**
 * Données pour la création/mise à jour d'une banque (institution physique).
 * Sans portée filiale — une banque est un tiers global, les comptes qui la
 * référencent sont eux toujours rattachés à la filiale siège.
 */
export type BankCreationData = Omit<Bank, 'id'>;
export type BankUpdateData = Partial<BankCreationData>;

/** Crée une nouvelle banque. Protégé par rôle (ADMIN, FINANCIAL_DIRECTOR). */
export const createBank = async (data: BankCreationData): Promise<Bank> => {
  const { data: bank } = await api.post<Bank>('/finance/banks', data);
  return bank;
};

/** Liste toutes les banques. */
export const getBanks = async (): Promise<Bank[]> => {
  const { data } = await api.get<Bank[]>('/finance/banks');
  return data;
};

/** Met à jour une banque. Protégé par rôle (ADMIN, FINANCIAL_DIRECTOR). */
export const updateBank = async (id: string, data: BankUpdateData): Promise<Bank> => {
  const { data: bank } = await api.patch<Bank>(`/finance/banks/${id}`, data);
  return bank;
};

/**
 * Supprime une banque. Protégé par rôle (ADMIN, FINANCIAL_DIRECTOR).
 * Refusé si des comptes de trésorerie la référencent encore.
 */
export const deleteBank = async (id: string): Promise<Bank> => {
  const { data } = await api.delete<Bank>(`/finance/banks/${id}`);
  return data;
};

export type { Bank, BankType };
