import { api } from '../api';
import { StockMovement, StockMovementType } from '../../types/models';
import { PaginatedResponse, PaginationParams } from '../../types/pagination.types';

const BASE_URL = '/purchase/stock-movements';

export interface FindStockMovementsQuery {
    subsidiaryId?: string;
    itemId?: string;
    type?: StockMovementType;
    startDate?: string;
    endDate?: string;
}

/**
 * Journal des mouvements de stock. Limit élevée : StockMovementsJournal.tsx
 * a besoin du jeu complet pour le tri/export côté client.
 */
export const getStockMovements = async (query?: FindStockMovementsQuery): Promise<StockMovement[]> => {
    const { data } = await api.get<PaginatedResponse<StockMovement>>(BASE_URL, { params: { ...query, limit: 500 } });
    return data.data;
};

/**
 * Version paginée/recherchable (page/limit/search) pour un futur usage en
 * pagination cliquable réelle.
 */
export const getStockMovementsPaginated = async (
    query: FindStockMovementsQuery & PaginationParams,
): Promise<PaginatedResponse<StockMovement>> => {
    const { data } = await api.get<PaginatedResponse<StockMovement>>(BASE_URL, { params: query });
    return data;
};

export interface CreateStockMovementData {
    itemId: string;
    type: StockMovementType;
    quantity: number;
    reason?: string;
}

export const createStockMovement = async (movementData: CreateStockMovementData): Promise<StockMovement> => {
    const { data } = await api.post(BASE_URL, movementData);
    return data;
};

export interface InventoryAdjustmentData {
    itemId: string;
    countedStock: number;
    reason?: string;
    subsidiaryId?: string;
}

export const adjustInventory = async (adjustmentData: InventoryAdjustmentData) => {
    const { data } = await api.post(`${BASE_URL}/inventory-adjustment`, adjustmentData);
    return data;
};

export interface WithdrawForOrderData {
    orderId: string;
    items: { itemId: string; quantity: number }[];
}

export const withdrawForOrder = async (withdrawalData: WithdrawForOrderData): Promise<StockMovement[]> => {
    const { data } = await api.post(`${BASE_URL}/withdraw-for-order`, withdrawalData);
    return data;
};
