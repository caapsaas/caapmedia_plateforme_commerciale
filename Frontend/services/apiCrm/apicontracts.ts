import { api } from '../api';
import { Contract } from '../../types';

/**
 * Données pour la création d'un contrat.
 * Les champs gérés par le backend (id, subsidiaryId) sont omis.
 */
export type ContractCreationData = Omit<Contract, 'id' | 'subsidiaryId'>;

/**
 * Données pour la mise à jour d'un contrat. Toutes les propriétés sont optionnelles.
 */
export type ContractUpdateData = Partial<ContractCreationData>;

/**
 * Crée un nouveau contrat.
 * Le contrat est automatiquement assigné à la filiale de l'utilisateur connecté.
 * @param contractData - Les données du contrat à créer.
 * @returns Le contrat nouvellement créé.
 */
export const createContract = async (contractData: ContractCreationData): Promise<Contract> => {
  const { data } = await api.post<Contract>('/crm/contracts', contractData);
  return data;
};

/**
 * Récupère la liste des contrats.
 * La liste est filtrée par le backend en fonction du rôle et de la filiale de l'utilisateur.
 * @returns Un tableau de contrats.
 */
export const getContracts = async (): Promise<Contract[]> => {
  const { data } = await api.get<Contract[]>('/crm/contracts');
  return data;
};

/**
 * Met à jour un contrat existant.
 * @param id - L'ID du contrat à mettre à jour.
 * @param updateData - Les champs du contrat à mettre à jour.
 * @returns Le contrat mis à jour.
 */
export const updateContract = async (id: string, updateData: ContractUpdateData): Promise<Contract> => {
  const { data } = await api.patch<Contract>(`/crm/contracts/${id}`, updateData);
  return data;
};

/**
 * Supprime un contrat par son ID.
 * @param id - L'ID du contrat à supprimer.
 */
export const deleteContract = async (id: string): Promise<void> => {
  await api.delete(`/crm/contracts/${id}`);
};
