import { CreateEquipmentDto, UpdateEquipmentDto, SearchEquipmentDto } from './dto/create-equipement.dto';
import { PrismaService } from "../../common/utils/prisma/prisma.service";
import { JwtUser } from '../../common/auth/jwt/jwt-user.interface';
import { Prisma } from '@prisma/client';
export declare class EquipementService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    includeAll: {
        maintenanceRecords: boolean;
        subsidiary: boolean;
    };
    create(createEquipementDto: CreateEquipmentDto, user: JwtUser): Promise<{
        subsidiary: {
            id: string;
            subsidiaryName: string;
            logoSvg: string;
            address: string;
            phone: string;
            email: string;
            ifu: string;
            rccm: string;
            bankName: string;
            accountNumber: string;
            swiftCode: string;
            shareCapital: Prisma.Decimal;
            isHeadquarter: boolean;
            taxRate: Prisma.Decimal;
            workingDays: number[];
            latitude: number | null;
            longitude: number | null;
            geofenceRadius: number;
        };
        maintenanceRecords: {
            description: string;
            id: string;
            equipmentId: string;
            maintenanceDate: Date;
            technician: string;
            maintenanceCost: Prisma.Decimal;
        }[];
    } & {
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.EquipmentStatus;
        equipmentName: string;
        lastMaintenanceDate: Date;
        nextMaintenanceDate: Date;
        acquisitionDate: Date;
        acquisitionValue: Prisma.Decimal;
    }>;
    findAll(user: JwtUser, querySubsidiaryId?: string): Promise<({
        subsidiary: {
            id: string;
            subsidiaryName: string;
            logoSvg: string;
            address: string;
            phone: string;
            email: string;
            ifu: string;
            rccm: string;
            bankName: string;
            accountNumber: string;
            swiftCode: string;
            shareCapital: Prisma.Decimal;
            isHeadquarter: boolean;
            taxRate: Prisma.Decimal;
            workingDays: number[];
            latitude: number | null;
            longitude: number | null;
            geofenceRadius: number;
        };
        maintenanceRecords: {
            description: string;
            id: string;
            equipmentId: string;
            maintenanceDate: Date;
            technician: string;
            maintenanceCost: Prisma.Decimal;
        }[];
    } & {
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.EquipmentStatus;
        equipmentName: string;
        lastMaintenanceDate: Date;
        nextMaintenanceDate: Date;
        acquisitionDate: Date;
        acquisitionValue: Prisma.Decimal;
    })[]>;
    findOne(id: string, user: JwtUser): Promise<{
        subsidiary: {
            id: string;
            subsidiaryName: string;
            logoSvg: string;
            address: string;
            phone: string;
            email: string;
            ifu: string;
            rccm: string;
            bankName: string;
            accountNumber: string;
            swiftCode: string;
            shareCapital: Prisma.Decimal;
            isHeadquarter: boolean;
            taxRate: Prisma.Decimal;
            workingDays: number[];
            latitude: number | null;
            longitude: number | null;
            geofenceRadius: number;
        };
        maintenanceRecords: {
            description: string;
            id: string;
            equipmentId: string;
            maintenanceDate: Date;
            technician: string;
            maintenanceCost: Prisma.Decimal;
        }[];
    } & {
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.EquipmentStatus;
        equipmentName: string;
        lastMaintenanceDate: Date;
        nextMaintenanceDate: Date;
        acquisitionDate: Date;
        acquisitionValue: Prisma.Decimal;
    }>;
    update(id: string, updateEquipementDto: UpdateEquipmentDto, user: JwtUser): Promise<{
        subsidiary: {
            id: string;
            subsidiaryName: string;
            logoSvg: string;
            address: string;
            phone: string;
            email: string;
            ifu: string;
            rccm: string;
            bankName: string;
            accountNumber: string;
            swiftCode: string;
            shareCapital: Prisma.Decimal;
            isHeadquarter: boolean;
            taxRate: Prisma.Decimal;
            workingDays: number[];
            latitude: number | null;
            longitude: number | null;
            geofenceRadius: number;
        };
        maintenanceRecords: {
            description: string;
            id: string;
            equipmentId: string;
            maintenanceDate: Date;
            technician: string;
            maintenanceCost: Prisma.Decimal;
        }[];
    } & {
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.EquipmentStatus;
        equipmentName: string;
        lastMaintenanceDate: Date;
        nextMaintenanceDate: Date;
        acquisitionDate: Date;
        acquisitionValue: Prisma.Decimal;
    }>;
    remove(id: string, user: JwtUser): Promise<{
        subsidiary: {
            id: string;
            subsidiaryName: string;
            logoSvg: string;
            address: string;
            phone: string;
            email: string;
            ifu: string;
            rccm: string;
            bankName: string;
            accountNumber: string;
            swiftCode: string;
            shareCapital: Prisma.Decimal;
            isHeadquarter: boolean;
            taxRate: Prisma.Decimal;
            workingDays: number[];
            latitude: number | null;
            longitude: number | null;
            geofenceRadius: number;
        };
        maintenanceRecords: {
            description: string;
            id: string;
            equipmentId: string;
            maintenanceDate: Date;
            technician: string;
            maintenanceCost: Prisma.Decimal;
        }[];
    } & {
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.EquipmentStatus;
        equipmentName: string;
        lastMaintenanceDate: Date;
        nextMaintenanceDate: Date;
        acquisitionDate: Date;
        acquisitionValue: Prisma.Decimal;
    }>;
    search(query: SearchEquipmentDto, user: JwtUser): Promise<({
        subsidiary: {
            id: string;
            subsidiaryName: string;
            logoSvg: string;
            address: string;
            phone: string;
            email: string;
            ifu: string;
            rccm: string;
            bankName: string;
            accountNumber: string;
            swiftCode: string;
            shareCapital: Prisma.Decimal;
            isHeadquarter: boolean;
            taxRate: Prisma.Decimal;
            workingDays: number[];
            latitude: number | null;
            longitude: number | null;
            geofenceRadius: number;
        };
        maintenanceRecords: {
            description: string;
            id: string;
            equipmentId: string;
            maintenanceDate: Date;
            technician: string;
            maintenanceCost: Prisma.Decimal;
        }[];
    } & {
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.EquipmentStatus;
        equipmentName: string;
        lastMaintenanceDate: Date;
        nextMaintenanceDate: Date;
        acquisitionDate: Date;
        acquisitionValue: Prisma.Decimal;
    })[]>;
}
