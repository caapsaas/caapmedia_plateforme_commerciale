import { api } from './api';
import { Subsidiary } from '../types';

/**
 * Récupère toutes les filiales disponibles.
 * @returns Une liste de filiales.
 */
export const getSubsidiaries = async (): Promise<Subsidiary[]> => {
  const { data } = await api.get<Subsidiary[]>('/subsidiaries');
  return data;
};
