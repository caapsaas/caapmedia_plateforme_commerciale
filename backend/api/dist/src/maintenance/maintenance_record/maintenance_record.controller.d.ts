import { MaintenanceRecordService } from "./maintenance_record.service";
import { CreateMaintenanceRecordDto, UpdateMaintenanceRecordDto, SearchMaintenanceRecordDto, FindMaintenanceRecordsDto } from "./dto/create-maintenance_record.dto";
export declare class MaintenanceRecordController {
    private service;
    constructor(service: MaintenanceRecordService);
    create(createMaintenanceRecordDto: CreateMaintenanceRecordDto): Promise<{
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
        description: string;
        id: string;
        equipmentId: string;
        maintenanceDate: Date;
        technician: string;
        maintenanceCost: import("@prisma/client/runtime/library").Decimal;
    }>;
    findAll(query: FindMaintenanceRecordsDto): Promise<import("../../common/pagination/pagination").PaginatedResult<{
        description: string;
        id: string;
        equipmentId: string;
        maintenanceDate: Date;
        technician: string;
        maintenanceCost: import("@prisma/client/runtime/library").Decimal;
    }>>;
    search(dto: SearchMaintenanceRecordDto): Promise<import("../../common/pagination/pagination").PaginatedResult<{
        description: string;
        id: string;
        equipmentId: string;
        maintenanceDate: Date;
        technician: string;
        maintenanceCost: import("@prisma/client/runtime/library").Decimal;
    }>>;
    findOne(id: string): Promise<{
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
        description: string;
        id: string;
        equipmentId: string;
        maintenanceDate: Date;
        technician: string;
        maintenanceCost: import("@prisma/client/runtime/library").Decimal;
    }>;
    update(id: string, updateMaintenanceRecordDto: UpdateMaintenanceRecordDto): Promise<{
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
        description: string;
        id: string;
        equipmentId: string;
        maintenanceDate: Date;
        technician: string;
        maintenanceCost: import("@prisma/client/runtime/library").Decimal;
    }>;
    remove(id: string): Promise<{
        description: string;
        id: string;
        equipmentId: string;
        maintenanceDate: Date;
        technician: string;
        maintenanceCost: import("@prisma/client/runtime/library").Decimal;
    }>;
}
