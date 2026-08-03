import { api } from '../api';
import { Supplier } from '../../types';
import { PaginatedResponse, PaginationParams } from '../../types/pagination.types';


/**
 * Crée un nouveau fournisseur.
 * @param data - Les données du fournisseur à créer.
 */
export const createSupplier = async (data: Omit<Supplier, 'id' | 'subsidiaryId'>): Promise<Supplier> => {
    const response = await api.post<Supplier>('/purchasing/suppliers', data);
    return response.data;
};

/**
 * Récupère tous les fournisseurs de la filiale de l'utilisateur. Limit élevée
 * pour préserver le comportement "tout charger" des appelants existants.
 */
export const getSuppliers = async (): Promise<Supplier[]> => {
    const response = await api.get<PaginatedResponse<Supplier>>('/purchasing/suppliers', { params: { limit: 500 } });
    return response.data.data;
};

/**
 * Version paginée/recherchable pour les vues liste et les selects.
 */
export const getSuppliersPaginated = async (
    params: PaginationParams & { subsidiaryId?: string },
): Promise<PaginatedResponse<Supplier>> => {
    const response = await api.get<PaginatedResponse<Supplier>>('/purchasing/suppliers', { params });
    return response.data;
};

/**
 * Récupère un fournisseur par son ID.
 * @param id - L'ID du fournisseur.
 */
export const getSupplierById = async (id: string): Promise<Supplier> => {
    const response = await api.get<Supplier>(`/purchasing/suppliers/${id}`);
    return response.data;
};

/**
 * Met à jour un fournisseur.
 * @param id - L'ID du fournisseur à mettre à jour.
 * @param data - Les données à mettre à jour.
 */
export const updateSupplier = async (id: string, data: Partial<Omit<Supplier, 'id' | 'subsidiaryId'>>): Promise<Supplier> => {
    const response = await api.patch<Supplier>(`/purchasing/suppliers/${id}`, data);
    return response.data;
};

/**
 * Supprime un fournisseur.
 * @param id - L'ID du fournisseur à supprimer.
 */
export const deleteSupplier = async (id: string) => {
    await api.delete(`/purchasing/suppliers/${id}`);
};
