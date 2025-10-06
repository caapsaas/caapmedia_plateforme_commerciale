import { api } from '../api';
import { MaintenanceRecord } from '../../types';

/**
 * DTO pour la création d'un enregistrement de maintenance.
 * Les dates sont généralement envoyées en tant que chaînes ISO.
 */
export interface CreateMaintenanceRecord {
  equipmentId: string;
  maintenanceDate: string;
  technician: string;
  description: string;
  cost: number;
}

/**
 * DTO pour la mise à jour d'un enregistrement de maintenance.
 * Tous les champs sont optionnels.
 */
export type UpdateMaintenanceRecord = Partial<CreateMaintenanceRecord>;

/**
 * DTO pour la recherche d'enregistrements de maintenance.
 */
export interface SearchMaintenanceRecord {
  equipmentId?: string;
  technician?: string;
  fromDate?: string;
  toDate?: string;
}

/**
 * Crée un nouvel enregistrement de maintenance.
 * @param data - Les données de l'enregistrement à créer.
 */
export const createMaintenanceRecord = async (data: CreateMaintenanceRecord): Promise<MaintenanceRecord> => {
  const response = await api.post<MaintenanceRecord>('/maintenance-records', data);
  return response.data;
};

/**
 * Récupère tous les enregistrements de maintenance pour un équipement donné.
 * @param equipmentId - L'ID de l'équipement.
 */
export const getMaintenanceRecordsForEquipment = async (equipmentId: string): Promise<MaintenanceRecord[]> => {
  const response = await api.get<MaintenanceRecord[]>('/maintenance-records', { params: { equipmentId } });
  return response.data;
};

/**
 * Recherche des enregistrements de maintenance en fonction de critères.
 * @param query - Les critères de recherche.
 */
export const searchMaintenanceRecords = async (query: SearchMaintenanceRecord): Promise<MaintenanceRecord[]> => {
  const response = await api.get<MaintenanceRecord[]>('/maintenance-records/search', { params: query });
  return response.data;
};

/**
 * Met à jour un enregistrement de maintenance existant.
 * @param id - L'ID de l'enregistrement à mettre à jour.
 * @param data - Les données à mettre à jour.
 */
export const updateMaintenanceRecord = async (id: string, data: UpdateMaintenanceRecord): Promise<MaintenanceRecord> => {
  const response = await api.patch<MaintenanceRecord>(`/maintenance-records/${id}`, data);
  return response.data;
};

/**
 * Supprime un enregistrement de maintenance.
 * @param id - L'ID de l'enregistrement à supprimer.
 */
export const deleteMaintenanceRecord = async (id: string): Promise<void> => {
  await api.delete(`/maintenance-records/${id}`);
};
