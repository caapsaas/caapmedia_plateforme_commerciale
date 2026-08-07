import { api } from '../api';
import { ItemPackagingUnit, StockItem } from '../../types/models';
import { StockItemFormData } from '../../types/forms';
import { PaginatedResponse, PaginationParams } from '../../types/pagination.types';

const BASE_URL = '/purchase/stock-items';

/**
 * Récupère les produits de stock (matières premières/consommables) de la filiale
 * de l'utilisateur connecté. Limit élevée pour préserver le comportement
 * "tout charger" des appelants existants (recherche/tri client-side, export).
 */
export const getStockItemsBySubsidiary = async (subsidiaryId?: string): Promise<StockItem[]> => {
    const { data } = await api.get<PaginatedResponse<StockItem>>(BASE_URL, {
        params: { ...(subsidiaryId ? { subsidiaryId } : {}), limit: 500 },
    });
    return data.data;
};

/**
 * Version paginée/recherchable pour les selects (AsyncSelect).
 */
export const getStockItemsPaginated = async (
    params: PaginationParams & { subsidiaryId?: string },
): Promise<PaginatedResponse<StockItem>> => {
    const { data } = await api.get<PaginatedResponse<StockItem>>(BASE_URL, { params });
    return data;
};

export const getStockItemById = async (id: string): Promise<StockItem> => {
    const { data } = await api.get(`${BASE_URL}/${id}`);
    return data;
};

export const createStockItem = async (itemData: StockItemFormData): Promise<StockItem> => {
    const { data } = await api.post(BASE_URL, itemData);
    return data;
};

export const updateStockItem = async (id: string, itemData: Partial<StockItemFormData>): Promise<StockItem> => {
    const { data } = await api.patch(`${BASE_URL}/${id}`, itemData);
    return data;
};

export const deleteStockItem = async (id: string): Promise<{ id: string }> => {
    const { data } = await api.delete(`${BASE_URL}/${id}`);
    return data;
};

// --- Unités d'emballage/achat (Chantier 2) ---

export interface PackagingUnitFormData {
    unitId: string;
    conversionFactor: number;
}

export const getPackagingUnits = async (itemId: string): Promise<ItemPackagingUnit[]> => {
    const { data } = await api.get(`${BASE_URL}/${itemId}/packaging-units`);
    return data;
};

export const addPackagingUnit = async (itemId: string, unitData: PackagingUnitFormData): Promise<ItemPackagingUnit> => {
    const { data } = await api.post(`${BASE_URL}/${itemId}/packaging-units`, unitData);
    return data;
};

export const updatePackagingUnit = async (packagingUnitId: string, unitData: Partial<PackagingUnitFormData>): Promise<ItemPackagingUnit> => {
    const { data } = await api.patch(`${BASE_URL}/packaging-units/${packagingUnitId}`, unitData);
    return data;
};

export const removePackagingUnit = async (packagingUnitId: string): Promise<{ id: string }> => {
    const { data } = await api.delete(`${BASE_URL}/packaging-units/${packagingUnitId}`);
    return data;
};
