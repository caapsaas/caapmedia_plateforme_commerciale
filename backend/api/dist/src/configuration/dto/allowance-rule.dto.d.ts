export declare class CreateAllowanceRuleDto {
    name: string;
    description?: string;
    minAge?: number;
    maxAge?: number;
    minSalary?: number;
    numberOfDependents?: number;
    amount?: number;
    percentageOfSalary?: number;
    effectiveDate: Date;
    expiryDate?: Date;
}
export declare class UpdateAllowanceRuleDto {
    name?: string;
    description?: string;
    minAge?: number;
    maxAge?: number;
    minSalary?: number;
    numberOfDependents?: number;
    amount?: number;
    percentageOfSalary?: number;
    effectiveDate?: Date;
    expiryDate?: Date;
    isActive?: boolean;
}
