export declare class TaxBracketDto {
    minSalary?: number;
    maxSalary?: number | null;
    rate: number;
    deductible?: number;
}
export declare class LeaveEntitlementDto {
    type: string;
    daysPerYear: number;
    isPaid: boolean;
    description?: string;
}
export declare class CreatePayrollConfigDto {
    subsidiaryId: string;
    minWage: number;
    minWagePeriod?: string;
    minWageEffectiveDate: Date;
    cnpsEmployeeRate?: number;
    cnpsEmployerRate?: number;
}
export declare class UpdatePayrollConfigDto {
    minWage?: number;
    minWagePeriod?: string;
    minWageEffectiveDate?: string;
    cnpsEmployeeRate?: number;
    cnpsEmployerRate?: number;
    cfcEmployeeRate?: number;
    cfcEmployerRate?: number;
    fneRate?: number;
    cnpsCap?: number;
    professionalExpenseRate?: number;
    fixedAbatementAnnual?: number;
    riskGroupARate?: number;
    riskGroupBRate?: number;
    riskGroupCRate?: number;
    irppBrackets?: TaxBracketDto[];
    leaveEntitlements?: LeaveEntitlementDto[];
}
