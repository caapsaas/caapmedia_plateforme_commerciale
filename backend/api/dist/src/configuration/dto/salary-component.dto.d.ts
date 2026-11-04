declare enum SalaryComponentType {
    EARNING = "EARNING",
    DEDUCTION = "DEDUCTION",
    TAX = "TAX",
    CONTRIBUTION = "CONTRIBUTION"
}
declare enum ContributionType {
    EMPLOYEE = "EMPLOYEE",
    EMPLOYER = "EMPLOYER",
    BOTH = "BOTH"
}
export declare class CreateSalaryComponentDto {
    name: string;
    description?: string;
    type: SalaryComponentType;
    rate?: number;
    fixedAmount?: number;
    contributionType?: ContributionType;
    displayOrder?: number;
}
export declare class UpdateSalaryComponentDto {
    name?: string;
    description?: string;
    type?: SalaryComponentType;
    rate?: number;
    fixedAmount?: number;
    contributionType?: ContributionType;
    isActive?: boolean;
    displayOrder?: number;
}
export {};
