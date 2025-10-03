import { api } from './api';
import { Order, OrderStatus } from '../types';

/**
 * Récupère toutes les commandes.
 * Le backend devrait filtrer par filiale en se basant sur le token de l'utilisateur.
 */
export const getOrders = async (): Promise<Order[]> => {
    const { data } = await api.get<Order[]>('/orders');
    return data;
};

/**
 * Enregistre un paiement pour une commande spécifique.
 * @param payload - Contient l'ID de la commande et le montant payé.
 */
export const recordOrderPayment = async (payload: { orderId: string; amount: number }): Promise<Order> => {
    const { data } = await api.post<Order>(`/orders/${payload.orderId}/payment`, { amount: payload.amount });
    return data;
};

/**
 * Met à jour le statut d'une commande.
 * @param payload - Contient l'ID de la commande et le nouveau statut.
 */
export const updateOrderStatus = async (payload: { orderId: string; newStatus: OrderStatus }): Promise<Order> => {
    const { data } = await api.patch<Order>(`/orders/${payload.orderId}/status`, { status: payload.newStatus });
    return data;
};

/**
 * Valide une commande pour la mettre en production.
 * @param orderId - L'ID de la commande à valider.
 */
export const validateOrderForProduction = async (orderId: string): Promise<Order> => {
    const { data } = await api.post<Order>(`/orders/${orderId}/validate-production`);
    return data;
};
