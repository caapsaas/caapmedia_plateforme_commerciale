import { api } from './api';
import { Product } from '../types';

/**
 * Récupère tous les produits.
 * Le backend filtre automatiquement par la filiale de l'utilisateur connecté.
 */
export const getProducts = async (): Promise<Product[]> => {
    const { data } = await api.get('/products');
    return data;
};

/**
 * Récupère un produit spécifique par son ID.
 * @param id - L'ID du produit à récupérer.
 */
export const getProductById = async (id: string): Promise<Product> => {
    const { data } = await api.get(`/products/${id}`);
    return data;
};

/**
 * Crée un nouveau produit.
 * @param productData - Les données du produit à créer.
 */
export const createProduct = async (productData: Omit<Product, 'id' | 'subsidiaryId'>): Promise<Product> => {
    const { data } = await api.post('/products', productData);
    return data;
};

/**
 * Met à jour un produit existant.
 * @param productData - Les données du produit à mettre à jour, incluant son ID.
 */
export const updateProduct = async (productData: Partial<Product> & { id: string }): Promise<Product> => {
    const { data } = await api.patch(`/products/${productData.id}`, productData);
    return data;
};

/**
 * Supprime un produit par son ID.
 * @param id - L'ID du produit à supprimer.
 */
export const deleteProduct = async (id: string): Promise<{ id: string }> => {
    const { data } = await api.delete(`/products/${id}`);
    return data;
};
