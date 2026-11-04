import { PaginationQueryDto } from "../../../common/pagination/dto/pagination-query.dto";
export declare class CreateMaintenanceRecordDto {
    maintenanceDate: string;
    technician: string;
    description: string;
    maintenanceCost: number;
    equipmentId: string;
}
declare const UpdateMaintenanceRecordDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateMaintenanceRecordDto>>;
export declare class UpdateMaintenanceRecordDto extends UpdateMaintenanceRecordDto_base {
}
export declare class SearchMaintenanceRecordDto extends PaginationQueryDto {
    equipmentId?: string;
    fromDate?: string;
    toDate?: string;
    technician?: string;
}
export declare class FindMaintenanceRecordsDto extends PaginationQueryDto {
    equipmentId: string;
}
export {};
