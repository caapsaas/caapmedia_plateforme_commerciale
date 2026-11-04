import { PayrollStatus } from '@prisma/client';
export declare class CreatePayrollRecordDto {
    employeeName: string;
    employeeId: string;
    payrollPeriod: string;
    baseSalary?: number;
    bonus?: number;
    allowances?: number;
    overtime?: number;
    otherEarnings?: number;
    grossSalary?: number;
    cnpsEmployee?: number;
    cfcEmployee?: number;
    irpp?: number;
    cac?: number;
    otherDeductions?: number;
    deductions?: number;
    cnpsEmployer?: number;
    cfcEmployer?: number;
    fne?: number;
    totalEmployerCost?: number;
    netSalary?: number;
    paymentDate?: Date;
    signature?: string;
    deductionsDetail?: {
        label: string;
        amount: number;
        type?: 'STATUTORY' | 'VOLUNTARY' | 'ADVANCE' | 'OTHER';
    }[];
    notes?: string;
    status: PayrollStatus;
}
declare const UpdatePayrollRecordDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreatePayrollRecordDto>>;
export declare class UpdatePayrollRecordDto extends UpdatePayrollRecordDto_base {
}
export {};
