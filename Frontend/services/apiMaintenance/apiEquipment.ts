import { api } from "../api";
import { Equipment, EquipmentStatus } from "../../types";

export interface CreateEquipmentDto {
    equipmentName: string;
    acquisitionDate: string;
    acquisitionValue: number;
    status: EquipmentStatus;
    lastMaintenanceDate: string;
    nextMaintenanceDate: string;
    subsidiaryId?: string;
}

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

export const createEquipment = async (data: CreateEquipmentDto): Promise<Equipment> => {
    const response = await api.post<Equipment>('/equipements', data);
    return response.data;
};

export const getEquipments = async (subsidiaryId?: string): Promise<Equipment[]> => {
    const response = await api.get<Equipment[]>('/equipements', {
        params: subsidiaryId ? { subsidiaryId } : undefined,
    });
    return response.data;
};

export const searchEquipments = async (query: SearchEquipmentDto): Promise<Equipment[]> => {
    const response = await api.get<Equipment[]>('/equipements/search', { params: query });
    return response.data;
};

export const getEquipmentById = async (id: string): Promise<Equipment> => {
    const response = await api.get<Equipment>(`/equipements/${id}`);
    return response.data;
};

export const updateEquipment = async (id: string, data: Partial<CreateEquipmentDto>): Promise<Equipment> => {
    const response = await api.patch<Equipment>(`/equipements/${id}`, data);
    return response.data;
};

export const deleteEquipment = async (id: string): Promise<void> => {
    await api.delete(`/equipements/${id}`);
};
