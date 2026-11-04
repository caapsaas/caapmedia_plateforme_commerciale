import { AbsenceType } from '@prisma/client';
export declare class CreateAbsenceRecordDto {
    employeeName: string;
    employeeId: string;
    startDate: Date;
    endDate: Date;
    reason: string;
    documentUrl?: string;
    typeAbsence: AbsenceType;
}
declare const UpdateAbsenceRecordDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateAbsenceRecordDto>>;
export declare class UpdateAbsenceRecordDto extends UpdateAbsenceRecordDto_base {
}
export {};
