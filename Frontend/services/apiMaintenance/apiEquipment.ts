import { api } from "../api";
import { Equipment } from "../../types";
import { EquipmentStatus } from "../../types";

export interface createEquipment {
    name: string;
    type: string;
    status: EquipmentStatus;
    lastMaintenanceDate: string;
    nextMaintenanceDate: string;
    acquisitionDate: string;
    acquisitionValue: number;
}

export type UpdateEquipment = Partial<createEquipment>;

export interface SearchEquipment {
    name?: string;
    type?: string;
    status?: EquipmentStatus;
    lastMaintenanceDate?: string;
    nextMaintenanceDate?: string;
    acquisitionDate?: string;
    acquisitionValue?: number;
}

/**
 * Crée un nouvel équipement.
 * @param data - Les données de l'équipement à créer.
 */
export const createEquipment = async (data: createEquipment): Promise<Equipment> => {
    const response = await api.post<Equipment>('/equipements', data);
    return response.data;
};

/**
 * Récupère tous les équipements d'une filiale.
 */
export const getEquipmentsBySubsidiary = async (): Promise<Equipment[]> => {
    const response = await api.get<Equipment[]>('/equipements');
    return response.data;
};

/**
 * Recherche des équipements en fonction de critères.
 * @param query - Les critères de recherche.
 */
export const searchEquipments = async (query: SearchEquipment): Promise<Equipment[]> => {
    const response = await api.get<Equipment[]>('/equipements/search', { params: query });
    return response.data;
};

/**
 * Récupère un équipement par son ID.
 * @param id - L'ID de l'équipement.
 */
export const getEquipmentById = async (id: string): Promise<Equipment> => {
    const response = await api.get<Equipment>(`/equipements/${id}`);
    return response.data;
};

/**
 * Met à jour un équipement.
 * @param id - L'ID de l'équipement à mettre à jour.
 * @param data - Les données à mettre à jour.
 */
export const updateEquipment = async (id: string, data: UpdateEquipment): Promise<Equipment> => {
    const response = await api.patch<Equipment>(`/equipements/${id}`, data);
    return response.data;
};

/**
 * Supprime un équipement.
 * @param id - L'ID de l'équipement à supprimer.
 */
export const deleteEquipment = async (id: string): Promise<void> => {
    await api.delete(`/equipements/${id}`);
};


