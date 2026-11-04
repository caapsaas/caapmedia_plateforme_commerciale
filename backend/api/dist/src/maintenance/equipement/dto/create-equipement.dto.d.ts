import { EquipmentStatus } from '@prisma/client';
export declare class CreateEquipmentDto {
    equipmentName: string;
    lastMaintenanceDate: string;
    nextMaintenanceDate: string;
    acquisitionDate: string;
    acquisitionValue: number;
    status: EquipmentStatus;
    subsidiaryId?: string;
}
declare const UpdateEquipmentDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateEquipmentDto>>;
export declare class UpdateEquipmentDto extends UpdateEquipmentDto_base {
}
export declare class SearchEquipmentDto {
    equipmentName?: string;
    status?: EquipmentStatus;
    acquisitionFromDate?: string;
    acquisitionToDate?: string;
    lastMaintenanceFromDate?: string;
    lastMaintenanceToDate?: string;
    nextMaintenanceFromDate?: string;
    nextMaintenanceToDate?: string;
}
export {};
