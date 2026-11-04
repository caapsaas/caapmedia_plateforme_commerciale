import { Gender, ContractType, EmployeeStatus, PaymentMethod, LeaveType, SalaryInputMode } from '@prisma/client';
export declare class LeaveBalanceDto {
    annual: number;
    sick: number;
    personal: number;
    maternity: number;
    paternity: number;
    other: number;
    unpaid?: number;
}
export declare class LeaveRecordDto {
    leaveRecordType: LeaveType;
    startDate: Date;
    endDate: Date;
    days: number;
}
export declare class IndemnitiesDto {
    type: string;
    amount: number;
}
export declare class SingleDocumentDto {
    name: string;
    url: string;
}
export declare class EmployeeDocumentsDto {
    contract?: SingleDocumentDto | null;
    idCard?: SingleDocumentDto | null;
    workPermit?: SingleDocumentDto | null;
    diplomas?: SingleDocumentDto[];
}
export declare class CreateEmployeeDto {
    lastName: string;
    firstName: string;
    birthDate: Date;
    address: string;
    phone: string;
    email: string;
    nationality: string;
    socialSecurityNumber: string;
    positions: string;
    department: string;
    hireDate: Date;
    workLocation: string;
    salaryInputMode?: SalaryInputMode;
    targetNetSalary?: number;
    baseSalary: number;
    bonus: number;
    benefits?: string[];
    gender: Gender;
    contractType: ContractType;
    status: EmployeeStatus;
    paymentMethod: PaymentMethod;
    bankName?: string;
    bankAccountNumber?: string;
    managerId?: string;
    subsidiaryId?: string;
    leaveBalance?: LeaveBalanceDto;
    leaveRecords?: LeaveRecordDto[];
    documents?: EmployeeDocumentsDto;
    indemnities?: IndemnitiesDto[];
    numberDependents?: number;
    situationMatrimony?: string;
    cnpsNumber?: string;
    cnpsNumberEncrypted?: string;
    categoryCodeCNPS?: string;
    taxIdNTif?: string;
}
declare const UpdateEmployeeDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateEmployeeDto>>;
export declare class UpdateEmployeeDto extends UpdateEmployeeDto_base {
}
export {};
