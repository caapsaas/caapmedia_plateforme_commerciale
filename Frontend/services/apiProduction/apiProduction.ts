import { api } from '../api';

// --- Types ---

export interface EquipmentWithCost {
    id: string;
    equipmentName: string;
    status: string;
    subsidiaryId: string;
    hourlyRate: number | null;
    costConfigId: string | null;
}

export interface UpsertEquipmentCostDto {
    equipmentId: string;
    hourlyRate: number;
}

export interface CommercialParams {
    id: string;
    minMarginPercent: number;
    maxMarginPercent: number;
    updatedAt: string;
}

export interface UpsertCommercialParamsDto {
    minMarginPercent: number;
    maxMarginPercent: number;
}

export interface WorkflowStep {
    id: string;
    stepOrder: number;
    equipmentId: string;
    equipment: {
        id: string;
        equipmentName: string;
        costConfig?: { hourlyRate: number } | null;
    };
}

export interface Workflow {
    id: string;
    name: string;
    description?: string | null;
    itemId?: string | null;
    isActive: boolean;
    createdAt: string;
    steps: WorkflowStep[];
    item?: { id: string; name: string } | null;
}

// Réponse du endpoint resolve/:itemId — chaque étape inclut hourlyRate courant
export interface ResolvedWorkflowStep {
    equipmentId: string;
    equipmentName: string;
    stepOrder: number;
    hourlyRate: number | null;
}

export interface ResolvedWorkflow {
    workflowId: string;
    workflowName: string;
    steps: ResolvedWorkflowStep[];
}

export interface CreateWorkflowStepDto {
    equipmentId: string;
    stepOrder: number;
}

export interface CreateWorkflowDto {
    name: string;
    description?: string;
    itemId?: string;
    isActive?: boolean;
    steps: CreateWorkflowStepDto[];
}

export type UpdateWorkflowDto = Partial<CreateWorkflowDto>;

// --- Equipment Cost Config ---

export const getEquipmentCosts = async (subsidiaryId?: string): Promise<EquipmentWithCost[]> => {
    const { data } = await api.get('/production/equipment-costs', { params: subsidiaryId ? { subsidiaryId } : undefined });
    return data;
};

export const upsertEquipmentCost = async (dto: UpsertEquipmentCostDto): Promise<void> => {
    await api.post('/production/equipment-costs', dto);
};

export const getConfiguredEquipments = async (subsidiaryId?: string): Promise<EquipmentWithCost[]> => {
    const { data } = await api.get('/production/equipment-costs/configured', {
        params: subsidiaryId ? { subsidiaryId } : undefined,
    });
    return data;
};

// --- Commercial Params ---

export const getCommercialParams = async (): Promise<CommercialParams> => {
    const { data } = await api.get('/production/commercial-params');
    return data;
};

export const upsertCommercialParams = async (dto: UpsertCommercialParamsDto): Promise<CommercialParams> => {
    const { data } = await api.put('/production/commercial-params', dto);
    return data;
};

// --- Equipment CRUD (maintenance module) ---

export interface Equipment {
    id: string;
    equipmentName: string;
    status: 'OPERATIONAL' | 'NEEDS_MAINTENANCE' | 'OUT_OF_SERVICE';
    acquisitionDate: string;
    acquisitionValue: number;
    lastMaintenanceDate: string;
    nextMaintenanceDate: string;
    subsidiaryId: string;
    subsidiary?: { id: string; subsidiaryName: string };
}

export interface CreateEquipmentDto {
    equipmentName: string;
    status: 'OPERATIONAL' | 'NEEDS_MAINTENANCE' | 'OUT_OF_SERVICE';
    acquisitionDate: string;
    acquisitionValue: number;
    lastMaintenanceDate: string;
    nextMaintenanceDate: string;
    subsidiaryId?: string;
}

export const getEquipments = async (subsidiaryId?: string): Promise<Equipment[]> => {
    const { data } = await api.get('/equipements', {
        params: subsidiaryId ? { subsidiaryId } : undefined,
    });
    return data;
};

export const createEquipment = async (dto: CreateEquipmentDto): Promise<Equipment> => {
    const { data } = await api.post('/equipements', dto);
    return data;
};

export const updateEquipment = async (id: string, dto: Partial<CreateEquipmentDto>): Promise<Equipment> => {
    const { data } = await api.patch(`/equipements/${id}`, dto);
    return data;
};

export const deleteEquipment = async (id: string): Promise<void> => {
    await api.delete(`/equipements/${id}`);
};

// --- Production Workflows ---

export const getWorkflows = async (subsidiaryId?: string): Promise<Workflow[]> => {
    const { data } = await api.get('/production/workflows', {
        params: subsidiaryId ? { subsidiaryId } : undefined,
    });
    return data;
};

export const getWorkflowById = async (id: string): Promise<Workflow> => {
    const { data } = await api.get(`/production/workflows/${id}`);
    return data;
};

// Résout le workflow d'un service — retourne les étapes avec les taux horaires courants.
// Retourne null si aucun workflow n'est configuré pour ce service.
export const resolveWorkflow = async (itemId: string): Promise<ResolvedWorkflow | null> => {
    try {
        const { data } = await api.get(`/production/workflows/resolve/${itemId}`);
        return data;
    } catch {
        return null;
    }
};

export const createWorkflow = async (dto: CreateWorkflowDto): Promise<Workflow> => {
    const { data } = await api.post('/production/workflows', dto);
    return data;
};

export const updateWorkflow = async (id: string, dto: UpdateWorkflowDto): Promise<Workflow> => {
    const { data } = await api.patch(`/production/workflows/${id}`, dto);
    return data;
};

export const deleteWorkflow = async (id: string): Promise<void> => {
    await api.delete(`/production/workflows/${id}`);
};
