import { api } from '../api';
import { Supplier } from '../../types';


/**
 * Crée un nouveau fournisseur.
 * @param data - Les données du fournisseur à créer.
 */
export const createSupplier = async (data: Omit<Supplier, 'id' | 'subsidiaryId'>): Promise<Supplier> => {
    const response = await api.post<Supplier>('/purchasing/suppliers', data);
    return response.data;
};

/**
 * Récupère tous les fournisseurs de la filiale de l'utilisateur.
 */
export const getSuppliers = async (): Promise<Supplier[]> => {
    const response = await api.get<Supplier[]>('/purchasing/suppliers');
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
