import { api } from '../api';
import { Unit } from '../../types/models';

const BASE_URL = '/purchase/units';

export interface UnitFormData {
    name: string;
    symbol?: string;
}

// Référentiel d'unités de mesure (Chantier 2), partagé par tous les produits de stock.
export const getUnits = async (): Promise<Unit[]> => {
    const { data } = await api.get(BASE_URL);
    return data;
};

export const createUnit = async (unitData: UnitFormData): Promise<Unit> => {
    const { data } = await api.post(BASE_URL, unitData);
    return data;
};

export const updateUnit = async (id: string, unitData: Partial<UnitFormData>): Promise<Unit> => {
    const { data } = await api.patch(`${BASE_URL}/${id}`, unitData);
    return data;
};

export const deleteUnit = async (id: string): Promise<{ id: string }> => {
    const { data } = await api.delete(`${BASE_URL}/${id}`);
    return data;
};
