import { api } from '../api';
import { PaymentStatus, PurchaseOrderStatus, PaymentTerms } from '../../types';
import { PaginatedResponse, PaginationParams } from '../../types/pagination.types';
import type { PurchaseOrder } from '../../types';

/**
 * DTO pour la création d'un bon de commande.
 * Correspond à CreatePurchaseOrderDto du backend.
 */
export interface CreatePurchaseOrderDto {
    supplierId: string;
    expectedDeliveryDate: string;
    paymentTerms: PaymentTerms;
    items: {
        productId: string;
        quantity: number;
        purchasePrice: number;
        // Unité dans laquelle "quantity" est exprimée (Chantier 2) — absente =
        // unité de base du produit.
        purchaseUnitId?: string;
    }[];
}

/**
 * Périodes de filtrage pour les commandes.
 */
// Valeurs (pas les cles) de l'enum OrderPeriod backend - IsEnum() les valide
// telles quelles, en minuscules (pas de LAST_90_DAYS ici, absent cote backend).
export type OrderPeriod = 'all_time' | 'this_month' | 'last_month' | 'last_7_days' | 'last_30_days' | 'this_year' | 'custom';

/**
 * DTO pour le filtrage des bons de commande.
 * Correspond à FindAllPurchaseOrdersDto du backend.
 */
export interface FindAllPurchaseOrdersDto {
    supplierId?: string;
    status?: PurchaseOrderStatus;
    paymentStatus?: PaymentStatus;
    period?: OrderPeriod;
    startDate?: string; 
    endDate?: string; 
}

/**
 * DTO pour la mise à jour du statut d'un bon de commande.
 */
export interface UpdatePurchaseOrderStatusDto {
    status: PurchaseOrderStatus;
}

/**
 * DTO pour la réception d'articles d'un bon de commande.
 */
export interface ReceiveItemsDto {
    items: {
        purchaseOrderItemId: string;
        quantityReceived: number;
    }[];
}

/**
 * DTO pour l'enregistrement d'un paiement pour un bon de commande.
 */
export interface RecordPurchasePaymentDto {
    amount: number;
}

/**
 * Crée un nouveau bon de commande.
 * @param data - Les données du bon de commande à créer.
 */
export const createPurchaseOrder = async (data: CreatePurchaseOrderDto) => {
    const response = await api.post('/purchasing/purchase-orders', data);
    return response.data;
};

/**
 * Récupère tous les bons de commande avec des options de filtrage (compat —
 * limite haute, pour Purchasing.tsx qui a besoin du jeu de données filtré
 * complet pour le tri/export côté client).
 */
export const getPurchaseOrders = async (query?: FindAllPurchaseOrdersDto): Promise<PurchaseOrder[]> => {
    const response = await api.get<PaginatedResponse<PurchaseOrder>>('/purchasing/purchase-orders', {
        params: { ...query, limit: 500 },
    });
    return response.data.data;
};

/**
 * Version paginée/recherchable (page/limit/search) pour un futur usage en
 * pagination cliquable réelle.
 */
export const getPurchaseOrdersPaginated = async (
    query: FindAllPurchaseOrdersDto & PaginationParams,
): Promise<PaginatedResponse<PurchaseOrder>> => {
    const response = await api.get<PaginatedResponse<PurchaseOrder>>('/purchasing/purchase-orders', { params: query });
    return response.data;
};

/**
 * Récupère un bon de commande par son ID.
 * @param id - L'ID du bon de commande.
 */
export const getPurchaseOrderById = async (id: string) => {
    const response = await api.get(`/purchasing/purchase-orders/${id}`);
    return response.data;
};

/**
 * Met à jour le statut d'un bon de commande.
 * @param id - L'ID du bon de commande.
 * @param data - Le nouveau statut.
 */
export const updatePurchaseOrderStatus = async (id: string, data: UpdatePurchaseOrderStatusDto) => {
    const response = await api.patch(`/purchasing/purchase-orders/${id}/status`, data);
    return response.data;
};

/**
 * Enregistre la réception d'articles pour un bon de commande.
 * @param id - L'ID du bon de commande.
 * @param data - Les informations sur les articles reçus.
 */
export const receivePurchaseOrderItems = async (id: string, data: ReceiveItemsDto) => {
    const response = await api.post(`/purchasing/purchase-orders/${id}/receive`, data);
    return response.data;
};

/**
 * Enregistre un paiement pour un bon de commande.
 * @param id - L'ID du bon de commande.
 * @param data - Le montant du paiement.
 */
export const recordPurchaseOrderPayment = async (id: string, data: RecordPurchasePaymentDto) => {
    const response = await api.post(`/purchasing/purchase-orders/${id}/payment`, data);
    return response.data;
};
