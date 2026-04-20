import { api } from '.././api';
import { CustomerPaymentMethod, OrderStatus, PaymentStatus, ProductionStatus } from '../../types';

/**
 * DTO pour le filtrage des commandes, correspondant à FindAllOrdersDto du backend.
 */
export interface FindAllOrdersDto {
    customerId?: string;
    productId?: string;
    orderStatus?: OrderStatus;
    paymentStatus?: PaymentStatus;
    period?: 'all_time' | 'this_month' | 'last_month' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'this_year' | 'custom';
    startDate?: string;
    endDate?: string;
}

/**
 * Crée une nouvelle commande (pour un client).
 * Utilise FormData pour gérer l'upload de fichiers.
 * @param orderData - Les données de la commande à créer, incluant les fichiers.
 */
export const createOrder = async (orderData: FormData) => {
    const { data } = await api.post('/ecommerce/orders', orderData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return data;
};

/**
 * Crée une nouvelle commande (pour un commercial).
 * Utilise FormData pour gérer l'upload de fichiers.
 * @param orderData - Les données de la commande à créer, incluant les fichiers.
 */
export const createOrderBySalesRep = async (orderData: FormData) => {
    const { data } = await api.post('/ecommerce/orders/by-salesrep', orderData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return data;
};

/**
 * Crée une nouvelle commande (pour un commercial) en JSON.
 * @param orderData - Les données de la commande à créer.
 */
export const createOrderBySalesRepJson = async (orderData: any) => {
    const { data } = await api.post('/ecommerce/orders/by-salesrep/json', orderData, {
        headers: {
            'Content-Type': 'application/json',
        },
    });
    return data;
};

/**
 * Recupere la liste des creances clients
 */
export const getCredit = async () => {
    const { data } = await api.get('/ecommerce/orders/credit');
    return data;
}

/**
 * Récupère un compte de crédit client par son ID.
 * @param id L'ID du compte de crédit.
 */
export const getCreditById = async (id: string) => {
    const { data } = await api.get(`/ecommerce/orders/credit/${id}`);
    return data;
};

/**
 * Récupère toutes les commandes.
 * Le backend devrait filtrer par filiale en se basant sur le token de l'utilisateur.
 * @param query - Les paramètres de filtrage des commandes.
 */
export const getOrders = async (query?: FindAllOrdersDto) => {
    const { data } = await api.get('/ecommerce/orders', { params: query });
    return data;
};

/**
 * Récupère une commande spécifique par son ID.
 * @param id - L'ID de la commande.
 */
export const getOrderById = async (id: string) => {
    const { data } = await api.get(`/ecommerce/orders/${id}`);
    return data;
};

/**
 * Récupère les produits les plus vendus.
 */
export const getTopSellingProducts = async () => {
    const { data } = await api.get('/ecommerce/orders/analytics/top-selling');
    return data;
};

/**
 * Récupère les groupes de commandes pour un client spécifique.
 * @param customerId - L'ID du client.
 */
export const getOrdersByCustomer = async (customerId: string) => {
    const { data } = await api.get(`/ecommerce/orders/customer/${customerId}`);
    return data;
};

/**
 * Enregistre un paiement pour une commande spécifique.
 * @param payload - Contient l'ID de la commande, le montant et la méthode de paiement.
 */
export const recordOrderPayment = async (payload: { orderId: string; amount: number; paymentMethod: CustomerPaymentMethod }) => {
    const { data } = await api.patch(`/ecommerce/orders/payment/${payload.orderId}`, payload);
    return data;
};

/**
 * Met à jour le statut de production d'une commande.
 * @param payload - Contient l'ID de la commande et le nouveau statut d'une commande.
 */
export const updateOrderStatus = async (payload: { orderId: string; status: OrderStatus }) => {
    const { data } = await api.patch(`/ecommerce/orders/order-status/${payload.orderId}`, { status: payload.status });
    return data;
};

/**
 * Met à jour le statut de production d'une commande.
 * @param payload - Contient l'ID de la commande et le nouveau statut de production.
 */
export const updateProductionStatus = async (payload: { orderId: string; productionStatus: ProductionStatus }) => {
    const { data } = await api.patch(`/ecommerce/orders/production-status/${payload.orderId}`, { productionStatus: payload.productionStatus });
    return data;
};

/**
 * Valide une commande pour la production.
 * @param payload - Contient l'ID de la commande.
 * NB: Cette fonction n'est pas encore disponible sur le backend.
 */
export const validateOrderForProduction = async (payload: { orderId: string }) => {
    const { data } = await api.patch(`/ecommerce/orders/validate-production/${payload.orderId}`);
    return data;
};
    