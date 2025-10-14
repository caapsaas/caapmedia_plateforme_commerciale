import { api } from '../api';
import { FixedAsset } from '../../types';

/**
 * Données pour la création d'une immobilisation.
 * Inclut l'ID du compte de trésorerie pour la transaction de dépense.
 */
export type FixedAssetCreationData = Omit<FixedAsset, 'id' | 'subsidiaryId'> & { treasuryAccountId: string };

/**
 * Données pour la mise à jour d'une immobilisation. Toutes les propriétés sont optionnelles.
 */
export type FixedAssetUpdateData = Partial<Omit<FixedAsset, 'id' | 'subsidiaryId'>>;

/**
 * Crée une nouvelle immobilisation et la transaction de dépense associée.
 * Protégé par rôle (ADMIN, FINANCIAL_DIRECTOR).
 * @param assetData - Les données de l'immobilisation à créer.
 * @returns L'immobilisation nouvellement créée.
 */
export const createFixedAsset = async (assetData: FixedAssetCreationData): Promise<FixedAsset> => {
  const { data } = await api.post<FixedAsset>('/finance/assets/fixed', assetData);
  return data;
};

/**
 * Récupère la liste de toutes les immobilisations de la filiale.
 * @returns Un tableau d'immobilisations.
 */
export const getFixedAssets = async (): Promise<FixedAsset[]> => {
  const { data } = await api.get<FixedAsset[]>('/finance/assets/fixed');
  return data;
};

/**
 * Récupère les détails d'une immobilisation spécifique par son ID.
 * @param id - L'ID de l'immobilisation à récupérer.
 * @returns Les données de l'immobilisation.
 */
export const getFixedAssetById = async (id: string): Promise<FixedAsset> => {
  const { data } = await api.get<FixedAsset>(`/finance/assets/fixed/${id}`);
  return data;
};

/**
 * Met à jour une immobilisation existante.
 * Protégé par rôle (ADMIN, FINANCIAL_DIRECTOR).
 * @param id - L'ID de l'immobilisation à mettre à jour.
 * @param updateData - Les champs à mettre à jour.
 * @returns L'immobilisation mise à jour.
 */
export const updateFixedAsset = async (id: string, updateData: FixedAssetUpdateData): Promise<FixedAsset> => {
  const { data } = await api.patch<FixedAsset>(`/finance/assets/fixed/${id}`, updateData);
  return data;
};

/**
 * Supprime une immobilisation par son ID.
 * Protégé par rôle (ADMIN, FINANCIAL_DIRECTOR).
 * @param id - L'ID de l'immobilisation à supprimer.
 * @returns L'immobilisation qui a été supprimée.
 */
export const deleteFixedAsset = async (id: string): Promise<FixedAsset> => {
  const { data } = await api.delete<FixedAsset>(`/finance/assets/fixed/${id}`);
  return data;
};
