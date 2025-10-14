import { api } from '../api';
import { TaxRate } from '../../types';


/**
 * Crée une nouvelle taxe.
 * @param taxData - Les données de la taxe à créer.
 */
export const createTax = async (taxData: Omit<TaxRate, 'id'>): Promise<TaxRate> => {
    const { data } = await api.post<TaxRate>('/ecommerce/taxes', taxData);
    return data;
};

/**
 * Récupère toutes les taxes.
 */
export const getTaxes = async (): Promise<TaxRate[]> => {
    const { data } = await api.get<TaxRate[]>('/ecommerce/taxes');
    return data;
};

/**
 * Récupère une taxe spécifique par son ID.
 * @param id - L'ID de la taxe.
 */
export const getTaxById = async (id: string): Promise<TaxRate> => {
    const { data } = await api.get<TaxRate>(`/ecommerce/taxes/${id}`);
    return data;
};

/**
 * Met à jour une taxe.
 * @param id - L'ID de la taxe à mettre à jour.
 * @param taxData - Les données à mettre à jour.
 */
export const updateTax = async (id: string, taxData: Omit<TaxRate, 'id'>): Promise<TaxRate> => {
    const { data } = await api.patch<TaxRate>(`/ecommerce/taxes/${id}`, taxData);
    return data;
};

/**
 * Supprime une taxe.
 * @param id - L'ID de la taxe à supprimer.
 */
export const deleteTax = async (id: string) => {
    await api.delete(`/ecommerce/taxes/${id}`);
};