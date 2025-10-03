import { api } from './api';
import { Equipment, MaintenanceRecord } from '../types';

export type SaveEquipmentDto = Omit<Equipment, 'id' | 'subsidiaryId' | 'maintenanceHistory'> & { id?: string };
export type SaveLogDto = Omit<MaintenanceRecord, 'id'>;

/**
 * Récupère tous les équipements pour une filiale donnée.
 */
export const getEquipments = async (subsidiaryId: string): Promise<Equipment[]> => {
    const { data } = await api.get<Equipment[]>('/equipment', { params: { subsidiaryId } });
    return data;
};

/**
 * Enregistre (crée ou met à jour) un équipement.
 */
export const saveEquipment = async (equipmentData: SaveEquipmentDto): Promise<Equipment> => {
    if (equipmentData.id) {
        const { id, ...updateData } = equipmentData;
        const { data } = await api.patch<Equipment>(`/equipment/${id}`, updateData);
        return data;
    }
    const { data } = await api.post<Equipment>('/equipment', equipmentData);
    return data;
};

/**
 * Supprime un équipement.
 */
export const deleteEquipment = async (id: string): Promise<void> => {
    await api.delete(`/equipment/${id}`);
};

/**
 * Ajoute un enregistrement de maintenance à un équipement.
 */
export const addMaintenanceLog = async ({ equipmentId, record }: { equipmentId: string, record: SaveLogDto }): Promise<MaintenanceRecord> => {
    const { data } = await api.post<MaintenanceRecord>(`/equipment/${equipmentId}/logs`, record);
    return data;
};
