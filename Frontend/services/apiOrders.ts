import { api } from './api';
import { Order } from '../types';

// Fonction pour récupérer toutes les commandes
export const getOrders = async (): Promise<Order[]> => {
    const { data } = await api.get('/orders'); // Assurez-vous que cet endpoint existe dans votre backend
    return data;
};

