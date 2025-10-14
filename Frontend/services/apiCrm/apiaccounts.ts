import { api } from '../api';
import { Account } from '../../types';

/**
 * Données nécessaires pour la création d'un compte.
 * 'id', 'salesRepId', 'createdAt', 'updatedAt' sont omis car gérés par le backend.
 */
export type AccountCreationData = Omit<Account, 'id' | 'salesRepId' | 'createdAt' | 'updatedAt'>;

/**
 * Données pour la mise à jour d'un compte. Toutes les propriétés sont optionnelles.
 */
export type AccountUpdateData = Partial<AccountCreationData>;

/**
 * Crée un nouveau compte client.
 * La route est publique, mais si un utilisateur est authentifié,
 * le compte sera automatiquement assigné à cet utilisateur et à sa filiale.
 * @param accountData - Les données du compte à créer.
 * @returns Le compte nouvellement créé.
 */
export const createAccount = async (accountData: AccountCreationData): Promise<Account> => {
  const { data } = await api.post<Account>('/crm/accounts', accountData);
  return data;
};

/**
 * Récupère la liste des comptes.
 * La liste est filtrée par le backend en fonction du rôle de l'utilisateur :
 * - COMMERCIAL: ne voit que ses propres comptes.
 * - ADMIN: voit tous les comptes de sa filiale.
 * @returns Une promesse résolue avec un tableau de comptes.
 */
export const getAccounts = async (): Promise<Account[]> => {
  const { data } = await api.get<Account[]>('/crm/accounts');
  return data;
};

/**
 * Récupère les détails d'un compte spécifique par son ID.
 * L'accès est restreint aux comptes de la filiale de l'utilisateur
 * et aux comptes assignés si l'utilisateur est un COMMERCIAL.
 * @param id - L'ID du compte à récupérer.
 * @returns Une promesse résolue avec les données du compte.
 */
export const getAccountById = async (id: string): Promise<Account> => {
  const { data } = await api.get<Account>(`/crm/accounts/${id}`);
  return data;
};

/**
 * Met à jour un compte existant.
 * L'utilisateur doit avoir les permissions nécessaires sur le compte.
 * @param id - L'ID du compte à mettre à jour.
 * @param updateData - Les champs du compte à mettre à jour.
 * @returns Une promesse résolue avec le compte mis à jour.
 */
export const updateAccount = async (id: string, updateData: AccountUpdateData): Promise<Account> => {
  const { data } = await api.patch<Account>(`/crm/accounts/${id}`, updateData);
  return data;
};

/**
 * Supprime un compte par son ID.
 * L'utilisateur doit avoir les permissions nécessaires sur le compte.
 * @param id - L'ID du compte à supprimer.
 * @returns Une promesse résolue avec l'objet compte supprimé.
 */
export const deleteAccount = async (id: string): Promise<Account> => {
  const { data } = await api.delete<Account>(`/crm/accounts/${id}`);
  return data;
};
