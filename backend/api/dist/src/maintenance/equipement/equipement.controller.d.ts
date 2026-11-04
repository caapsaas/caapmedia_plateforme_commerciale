import type { JwtUser } from '../../common/auth/jwt/jwt-user.interface';
import { EquipementService } from './equipement.service';
import { CreateEquipmentDto, UpdateEquipmentDto, SearchEquipmentDto } from './dto/create-equipement.dto';
export declare class EquipementController {
    private readonly equipementService;
    constructor(equipementService: EquipementService);
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
            shareCapital: import("@prisma/client/runtime/library").Decimal;
            isHeadquarter: boolean;
            taxRate: import("@prisma/client/runtime/library").Decimal;
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
            maintenanceCost: import("@prisma/client/runtime/library").Decimal;
        }[];
    } & {
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.EquipmentStatus;
        equipmentName: string;
        lastMaintenanceDate: Date;
        nextMaintenanceDate: Date;
        acquisitionDate: Date;
        acquisitionValue: import("@prisma/client/runtime/library").Decimal;
    }>;
    findAll(user: JwtUser, subsidiaryId: string | undefined): Promise<({
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
            shareCapital: import("@prisma/client/runtime/library").Decimal;
            isHeadquarter: boolean;
            taxRate: import("@prisma/client/runtime/library").Decimal;
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
            maintenanceCost: import("@prisma/client/runtime/library").Decimal;
        }[];
    } & {
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.EquipmentStatus;
        equipmentName: string;
        lastMaintenanceDate: Date;
        nextMaintenanceDate: Date;
        acquisitionDate: Date;
        acquisitionValue: import("@prisma/client/runtime/library").Decimal;
    })[]>;
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
            shareCapital: import("@prisma/client/runtime/library").Decimal;
            isHeadquarter: boolean;
            taxRate: import("@prisma/client/runtime/library").Decimal;
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
            maintenanceCost: import("@prisma/client/runtime/library").Decimal;
        }[];
    } & {
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.EquipmentStatus;
        equipmentName: string;
        lastMaintenanceDate: Date;
        nextMaintenanceDate: Date;
        acquisitionDate: Date;
        acquisitionValue: import("@prisma/client/runtime/library").Decimal;
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
            shareCapital: import("@prisma/client/runtime/library").Decimal;
            isHeadquarter: boolean;
            taxRate: import("@prisma/client/runtime/library").Decimal;
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
            maintenanceCost: import("@prisma/client/runtime/library").Decimal;
        }[];
    } & {
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.EquipmentStatus;
        equipmentName: string;
        lastMaintenanceDate: Date;
        nextMaintenanceDate: Date;
        acquisitionDate: Date;
        acquisitionValue: import("@prisma/client/runtime/library").Decimal;
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
            shareCapital: import("@prisma/client/runtime/library").Decimal;
            isHeadquarter: boolean;
            taxRate: import("@prisma/client/runtime/library").Decimal;
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
            maintenanceCost: import("@prisma/client/runtime/library").Decimal;
        }[];
    } & {
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.EquipmentStatus;
        equipmentName: string;
        lastMaintenanceDate: Date;
        nextMaintenanceDate: Date;
        acquisitionDate: Date;
        acquisitionValue: import("@prisma/client/runtime/library").Decimal;
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
            shareCapital: import("@prisma/client/runtime/library").Decimal;
            isHeadquarter: boolean;
            taxRate: import("@prisma/client/runtime/library").Decimal;
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
            maintenanceCost: import("@prisma/client/runtime/library").Decimal;
        }[];
    } & {
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.EquipmentStatus;
        equipmentName: string;
        lastMaintenanceDate: Date;
        nextMaintenanceDate: Date;
        acquisitionDate: Date;
        acquisitionValue: import("@prisma/client/runtime/library").Decimal;
    }>;
}
