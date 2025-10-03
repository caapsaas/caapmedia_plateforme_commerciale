import { api } from './api';
import { Product } from '../types';

// Fonction pour récupérer tous les produits
export const getProducts = async (): Promise<Product[]> => {
    const { data } = await api.get('/products');
    return data;
};
