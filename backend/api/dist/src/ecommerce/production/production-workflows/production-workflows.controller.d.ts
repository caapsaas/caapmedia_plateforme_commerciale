import { ProductionWorkflowsService } from './production-workflows.service';
import { CreateWorkflowDto, UpdateWorkflowDto } from './dto/workflow.dto';
export declare class ProductionWorkflowsController {
    private readonly service;
    constructor(service: ProductionWorkflowsService);
    create(dto: CreateWorkflowDto): Promise<{
        item: {
            id: string;
            name: string;
            category: string;
        };
        steps: ({
            equipment: {
                subsidiary: {
                    id: string;
                    subsidiaryName: string;
                };
                costConfig: {
                    hourlyRate: import("@prisma/client/runtime/library").Decimal;
                };
            } & {
                id: string;
                subsidiaryId: string;
                status: import("@prisma/client").$Enums.EquipmentStatus;
                equipmentName: string;
                lastMaintenanceDate: Date;
                nextMaintenanceDate: Date;
                acquisitionDate: Date;
                acquisitionValue: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            equipmentId: string;
            stepOrder: number;
            workflowId: string;
        })[];
    } & {
        description: string | null;
        id: string;
        name: string;
        isActive: boolean;
        itemId: string | null;
        updatedAt: Date;
        createdAt: Date;
    }>;
    findAll(subsidiaryId: string | undefined): Promise<({
        item: {
            id: string;
            name: string;
            category: string;
        };
        steps: ({
            equipment: {
                subsidiary: {
                    id: string;
                    subsidiaryName: string;
                };
                costConfig: {
                    hourlyRate: import("@prisma/client/runtime/library").Decimal;
                };
            } & {
                id: string;
                subsidiaryId: string;
                status: import("@prisma/client").$Enums.EquipmentStatus;
                equipmentName: string;
                lastMaintenanceDate: Date;
                nextMaintenanceDate: Date;
                acquisitionDate: Date;
                acquisitionValue: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            equipmentId: string;
            stepOrder: number;
            workflowId: string;
        })[];
    } & {
        description: string | null;
        id: string;
        name: string;
        isActive: boolean;
        itemId: string | null;
        updatedAt: Date;
        createdAt: Date;
    })[]>;
    resolve(itemId: string): Promise<{
        workflowId: string;
        workflowName: string;
        steps: {
            equipmentId: string;
            equipmentName: string;
            subsidiaryId: string;
            subsidiaryName: string;
            stepOrder: number;
            hourlyRate: import("@prisma/client/runtime/library").Decimal;
            isConfigured: boolean;
        }[];
    }>;
    findOne(id: string): Promise<{
        item: {
            id: string;
            name: string;
            category: string;
        };
        steps: ({
            equipment: {
                subsidiary: {
                    id: string;
                    subsidiaryName: string;
                };
                costConfig: {
                    hourlyRate: import("@prisma/client/runtime/library").Decimal;
                };
            } & {
                id: string;
                subsidiaryId: string;
                status: import("@prisma/client").$Enums.EquipmentStatus;
                equipmentName: string;
                lastMaintenanceDate: Date;
                nextMaintenanceDate: Date;
                acquisitionDate: Date;
                acquisitionValue: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            equipmentId: string;
            stepOrder: number;
            workflowId: string;
        })[];
    } & {
        description: string | null;
        id: string;
        name: string;
        isActive: boolean;
        itemId: string | null;
        updatedAt: Date;
        createdAt: Date;
    }>;
    update(id: string, dto: UpdateWorkflowDto): Promise<{
        item: {
            id: string;
            name: string;
            category: string;
        };
        steps: ({
            equipment: {
                subsidiary: {
                    id: string;
                    subsidiaryName: string;
                };
                costConfig: {
                    hourlyRate: import("@prisma/client/runtime/library").Decimal;
                };
            } & {
                id: string;
                subsidiaryId: string;
                status: import("@prisma/client").$Enums.EquipmentStatus;
                equipmentName: string;
                lastMaintenanceDate: Date;
                nextMaintenanceDate: Date;
                acquisitionDate: Date;
                acquisitionValue: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            equipmentId: string;
            stepOrder: number;
            workflowId: string;
        })[];
    } & {
        description: string | null;
        id: string;
        name: string;
        isActive: boolean;
        itemId: string | null;
        updatedAt: Date;
        createdAt: Date;
    }>;
    remove(id: string): Promise<{
        description: string | null;
        id: string;
        name: string;
        isActive: boolean;
        itemId: string | null;
        updatedAt: Date;
        createdAt: Date;
    }>;
}
