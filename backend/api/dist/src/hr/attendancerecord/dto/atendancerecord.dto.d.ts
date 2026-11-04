import { AttendanceStatus } from '@prisma/client';
export declare class CreateAttendanceRecordDto {
    employeeId?: string;
    employeeName?: string;
    attendanceDate: Date;
    arrivalTime?: Date;
    departureTime?: Date;
    breakStartTime?: Date;
    breakEndTime?: Date;
    signature?: string;
    arrivalLatitude?: number;
    arrivalLongitude?: number;
    departureLatitude?: number;
    departureLongitude?: number;
    isGeolocationValid?: boolean;
    accuracyMeters?: number;
    qrCodeToken?: string;
    status: AttendanceStatus;
}
declare const UpdateAttendanceRecordDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateAttendanceRecordDto>>;
export declare class UpdateAttendanceRecordDto extends UpdateAttendanceRecordDto_base {
}
export declare class AttendanceRecordQueryDto {
    subsidiaryId?: string;
    page?: number;
    limit?: number;
    search?: string;
}
export {};
