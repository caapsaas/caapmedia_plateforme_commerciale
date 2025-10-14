import { api } from '../api';
import { Opportunity } from '../../types';

/**
 * Données pour la création d'une opportunité.
 * Les champs gérés par le backend sont omis.
 * Inclut un tableau optionnel d'ID de produits.
 */
export type OpportunityCreationData = Omit<Opportunity, 'id' | 'userId' | 'subsidiaryId' | 'createdAt' | 'updatedAt'> & { productIds?: string[] };

/**
 * Données pour la mise à jour d'une opportunité. Toutes les propriétés sont optionnelles.
 */
export type OpportunityUpdateData = Partial<OpportunityCreationData>;

/**
 * Crée une nouvelle opportunité.
 * L'opportunité est automatiquement assignée à l'utilisateur connecté et à sa filiale.
 * @param opportunityData - Les données de l'opportunité à créer.
 * @returns L'opportunité nouvellement créée.
 */
export const createOpportunity = async (opportunityData: OpportunityCreationData): Promise<Opportunity> => {
  const { data } = await api.post<Opportunity>('/crm/opportunities', opportunityData);
  return data;
};

/**
 * Récupère la liste des opportunités.
 * La liste est filtrée par le backend en fonction du rôle de l'utilisateur :
 * - ADMIN: voit toutes les opportunités de la filiale.
 * - Autres: ne voient que leurs propres opportunités.
 * @returns Un tableau d'opportunités.
 */
export const getOpportunities = async (): Promise<Opportunity[]> => {
  const { data } = await api.get<Opportunity[]>('/crm/opportunities');
  return data;
};

/**
 * Récupère les détails d'une opportunité spécifique par son ID.
 * L'accès est restreint aux opportunités de la filiale de l'utilisateur.
 * @param id - L'ID de l'opportunité à récupérer.
 * @returns Les données de l'opportunité.
 */
export const getOpportunityById = async (id: string): Promise<Opportunity> => {
  const { data } = await api.get<Opportunity>(`/crm/opportunities/${id}`);
  return data;
};

/**
 * Met à jour une opportunité existante.
 * L'utilisateur doit avoir les permissions nécessaires sur l'opportunité.
 * @param id - L'ID de l'opportunité à mettre à jour.
 * @param updateData - Les champs de l'opportunité à mettre à jour.
 * @returns L'opportunité mise à jour.
 */
export const updateOpportunity = async (id: string, updateData: OpportunityUpdateData): Promise<Opportunity> => {
  const { data } = await api.patch<Opportunity>(`/crm/opportunities/${id}`, updateData);
  return data;
};

/**
 * Supprime une opportunité par son ID.
 * L'utilisateur doit avoir les permissions nécessaires sur l'opportunité.
 * @param id - L'ID de l'opportunité à supprimer.
 * @returns L'opportunité qui a été supprimée.
 */
export const deleteOpportunity = async (id: string): Promise<Opportunity> => {
  const { data } = await api.delete<Opportunity>(`/crm/opportunities/${id}`);
  return data;
};
