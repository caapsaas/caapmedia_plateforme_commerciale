import { api } from "../api";
import { Equipment, EquipmentStatus } from "../../types";

/**
 * DTO pour la recherche d'équipements, correspondant à SearchEquipmentDto du backend.
 */
export interface SearchEquipmentDto {
    equipmentName?: string;
    status?: EquipmentStatus;
    acquisitionFromDate?: string;
    acquisitionToDate?: string;
    lastMaintenanceFromDate?: string;
    lastMaintenanceToDate?: string;
    nextMaintenanceFromDate?: string;
    nextMaintenanceToDate?: string;
}

/**
 * Crée un nouvel équipement.
 * @param data - Les données de l'équipement à créer.
 */
export const createEquipment = async (data: Omit<Equipment,'id' | 'subsidiaryId' | 'maintenanceHistory'>): Promise<Equipment> => {
    const response = await api.post<Equipment>('/equipements', data);
    return response.data;
};

/**
 * Récupère tous les équipements de la filiale de l'utilisateur connecté.
 */
export const getEquipments = async (): Promise<Equipment[]> => {
    const response = await api.get<Equipment[]>('/equipements');
    return response.data;
};

/**
 * Recherche des équipements en fonction de critères.
 * @param query - Les critères de recherche.
 */
export const searchEquipments = async (query: SearchEquipmentDto) => {
    const response = await api.get('/equipements/search', { params: query });
    return response.data;
};

/**
 * Récupère un équipement par son ID.
 * @param id - L'ID de l'équipement.
 */
export const getEquipmentById = async (id: string) => {
    const response = await api.get(`/equipements/${id}`);
    return response.data;
};

/**
 * Met à jour un équipement.
 * @param id - L'ID de l'équipement à mettre à jour.
 * @param data - Les données à mettre à jour.
 */
export const updateEquipment = async (id: string, data: Partial<Omit<Equipment,'id' | 'subsidiaryId' | 'maintenanceHistory'>>) => {
    const response = await api.patch(`/equipements/${id}`, data);
    return response.data;
};

/**
 * Supprime un équipement.
 * @param id - L'ID de l'équipement à supprimer.
 */
export const deleteEquipment = async (id: string) => {
    await api.delete(`/equipements/${id}`);
};
