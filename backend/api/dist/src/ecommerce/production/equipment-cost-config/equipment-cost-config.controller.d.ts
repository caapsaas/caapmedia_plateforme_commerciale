import { EquipmentCostConfigService } from './equipment-cost-config.service';
import { UpsertEquipmentCostDto } from './dto/upsert-equipment-cost.dto';
import type { JwtUser } from "../../../common/auth/jwt/jwt-user.interface";
export declare class EquipmentCostConfigController {
    private readonly service;
    constructor(service: EquipmentCostConfigService);
    upsert(dto: UpsertEquipmentCostDto, user: JwtUser): Promise<{
        equipment: {
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
        hourlyRate: import("@prisma/client/runtime/library").Decimal;
        updatedAt: Date;
        updatedById: string | null;
    }>;
    findAll(subsidiaryId: string | undefined, user: JwtUser): Promise<{
        id: string;
        equipmentName: string;
        status: import("@prisma/client").$Enums.EquipmentStatus;
        subsidiaryId: string;
        subsidiaryName: string;
        hourlyRate: import("@prisma/client/runtime/library").Decimal;
        costConfigId: string;
        isConfigured: boolean;
    }[]>;
    findConfigured(subsidiaryId: string | undefined): Promise<{
        id: string;
        equipmentName: string;
        status: import("@prisma/client").$Enums.EquipmentStatus;
        subsidiaryId: string;
        subsidiaryName: string;
        hourlyRate: import("@prisma/client/runtime/library").Decimal;
    }[]>;
    findOne(equipmentId: string): Promise<{
        id: string;
        equipmentName: string;
        status: import("@prisma/client").$Enums.EquipmentStatus;
        subsidiaryId: string;
        subsidiaryName: string;
        hourlyRate: import("@prisma/client/runtime/library").Decimal;
        isConfigured: boolean;
    }>;
}
