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

// Prisma serializes Decimal values as strings in JSON responses.
type EquipmentResponse = Omit<Equipment, 'acquisitionValue'> & {
    acquisitionValue: number | string;
};

const normalizeEquipment = (equipment: EquipmentResponse): Equipment => ({
    ...equipment,
    acquisitionValue: Number(equipment.acquisitionValue),
});

export const createEquipment = async (data: CreateEquipmentDto): Promise<Equipment> => {
    const response = await api.post<EquipmentResponse>('/equipements', data);
    return normalizeEquipment(response.data);
};

export const getEquipments = async (subsidiaryId?: string): Promise<Equipment[]> => {
    const response = await api.get<EquipmentResponse[]>('/equipements', {
        params: subsidiaryId ? { subsidiaryId } : undefined,
    });
    return response.data.map(normalizeEquipment);
};

export const searchEquipments = async (query: SearchEquipmentDto): Promise<Equipment[]> => {
    const response = await api.get<EquipmentResponse[]>('/equipements/search', { params: query });
    return response.data.map(normalizeEquipment);
};

export const getEquipmentById = async (id: string): Promise<Equipment> => {
    const response = await api.get<EquipmentResponse>(`/equipements/${id}`);
    return normalizeEquipment(response.data);
};

export const updateEquipment = async (id: string, data: Partial<CreateEquipmentDto>): Promise<Equipment> => {
    const response = await api.patch<EquipmentResponse>(`/equipements/${id}`, data);
    return normalizeEquipment(response.data);
};

export const deleteEquipment = async (id: string): Promise<void> => {
    await api.delete(`/equipements/${id}`);
};
