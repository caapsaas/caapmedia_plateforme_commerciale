import { api } from '../api';
import { Subsidiary } from '../../types';

export type SubsidiaryCreationData = Omit<Subsidiary, 'id'>;

export type SubsidiaryUpdateData = Partial<SubsidiaryCreationData>;

export interface SubsidiarySearchQuery {
  subsidiaryName?: string;
  email?: string;
}

/**
 * Récupère toutes les filiales disponibles.
 * Protégé par rôle (ADMIN, HR_MANAGER).
 * @returns Une liste de filiales.
 */
export const getSubsidiaries = async (): Promise<Subsidiary[]> => {
  const { data } = await api.get<Subsidiary[]>('/subsidiaries');
  return data;
};

/**
 * Crée une nouvelle filiale.
 * Protégé par rôle (ADMIN).
 * @param subsidiaryData - Les données de la nouvelle filiale.
 * @returns La filiale créée.
 */
export const createSubsidiary = async (subsidiaryData: SubsidiaryCreationData): Promise<Subsidiary> => {
  const { data } = await api.post<Subsidiary>('/subsidiaries', subsidiaryData);
  return data;
};

/**
 * Met à jour une filiale existante.
 * Protégé par rôle (ADMIN, HR_MANAGER).
 * @param id - L'ID de la filiale à mettre à jour.
 * @param updateData - Les données à mettre à jour.
 * @returns La filiale mise à jour.
 */
export const updateSubsidiary = async (id: string, updateData: SubsidiaryUpdateData): Promise<Subsidiary> => {
  const { data } = await api.patch<Subsidiary>(`/subsidiaries/${id}`, updateData);
  return data;
};

/**
 * Supprime une filiale.
 * Protégé par rôle (ADMIN).
 * @param id - L'ID de la filiale à supprimer.
 */
export const deleteSubsidiary = async (id: string): Promise<{ message: string }> => {
  const { data } = await api.delete<{ message: string }>(`/subsidiaries/${id}`);
  return data;
};

/**
 * Recherche des filiales selon des critères.
 * Protégé par rôle (ADMIN, HR_MANAGER).
 * @param query - Les critères de recherche.
 * @returns Une liste de filiales correspondantes.
 */
export const searchSubsidiaries = async (query: SubsidiarySearchQuery): Promise<Subsidiary[]> => {
  const { data } = await api.get<Subsidiary[]>('/subsidiaries/search', { params: query });
  return data;
};
