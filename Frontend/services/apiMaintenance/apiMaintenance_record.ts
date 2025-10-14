import { api } from '../api';
import { MaintenanceRecord } from '../../types';


/**
 * DTO pour la recherche d'enregistrements de maintenance.
 * Correspond à SearchMaintenanceRecordDto du backend.
 */
export interface SearchMaintenanceRecordDto {
  equipmentId?: string;
  technician?: string;
  fromDate?: string;
  toDate?: string;
}

/**
 * Crée un nouvel enregistrement de maintenance.
 * @param data - Les données de l'enregistrement à créer.
 */
export const createMaintenanceRecord = async (data: MaintenanceRecord) => {
  const response = await api.post<MaintenanceRecord>('/maintenance-records', data);
  return response.data;
};

/**
 * Récupère tous les enregistrements de maintenance pour un équipement donné.
 * @param equipmentId - L'ID de l'équipement.
 */
export const getMaintenanceRecordsForEquipment = async (equipmentId: string) => {
  const response = await api.get('/maintenance-records', { params: { equipmentId } });
  return response.data;
};

/**
 * Recherche des enregistrements de maintenance en fonction de critères.
 * @param query - Les critères de recherche.
 */
export const searchMaintenanceRecords = async (query: SearchMaintenanceRecordDto) => {
  const response = await api.get('/maintenance-records/search', { params: query });
  return response.data;
};

/**
 * Récupère un enregistrement de maintenance par son ID.
 * @param id - L'ID de l'enregistrement.
 */
export const getMaintenanceRecordById = async (id: string) => {
  const response = await api.get(`/maintenance-records/${id}`);
  return response.data;
};

/**
 * Met à jour un enregistrement de maintenance existant.
 * @param id - L'ID de l'enregistrement à mettre à jour.
 * @param data - Les données à mettre à jour.
 */
export const updateMaintenanceRecord = async (id: string, data: Partial<MaintenanceRecord>) => {
  const response = await api.patch(`/maintenance-records/${id}`, data);
  return response.data;
};

/**
 * Supprime un enregistrement de maintenance.
 * @param id - L'ID de l'enregistrement à supprimer.
 */
export const deleteMaintenanceRecord = async (id: string) => {
  await api.delete(`/maintenance-records/${id}`);
};
