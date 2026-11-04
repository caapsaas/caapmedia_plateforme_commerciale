import { PrismaService } from "../../../common/utils/prisma/prisma.service";
import { UpsertEquipmentCostDto } from './dto/upsert-equipment-cost.dto';
import { Prisma } from '@prisma/client';
import { JwtUser } from "../../../common/auth/jwt/jwt-user.interface";
export declare class EquipmentCostConfigService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    upsert(dto: UpsertEquipmentCostDto, user: JwtUser): Promise<{
        equipment: {
            id: string;
            subsidiaryId: string;
            status: import("@prisma/client").$Enums.EquipmentStatus;
            equipmentName: string;
            lastMaintenanceDate: Date;
            nextMaintenanceDate: Date;
            acquisitionDate: Date;
            acquisitionValue: Prisma.Decimal;
        };
    } & {
        id: string;
        equipmentId: string;
        hourlyRate: Prisma.Decimal;
        updatedAt: Date;
        updatedById: string | null;
    }>;
    findAll(subsidiaryId?: string, user?: JwtUser): Promise<{
        id: string;
        equipmentName: string;
        status: import("@prisma/client").$Enums.EquipmentStatus;
        subsidiaryId: string;
        subsidiaryName: string;
        hourlyRate: Prisma.Decimal;
        costConfigId: string;
        isConfigured: boolean;
    }[]>;
    findOne(equipmentId: string): Promise<{
        id: string;
        equipmentName: string;
        status: import("@prisma/client").$Enums.EquipmentStatus;
        subsidiaryId: string;
        subsidiaryName: string;
        hourlyRate: Prisma.Decimal;
        isConfigured: boolean;
    }>;
    findConfigured(subsidiaryId?: string): Promise<{
        id: string;
        equipmentName: string;
        status: import("@prisma/client").$Enums.EquipmentStatus;
        subsidiaryId: string;
        subsidiaryName: string;
        hourlyRate: Prisma.Decimal;
    }[]>;
}
