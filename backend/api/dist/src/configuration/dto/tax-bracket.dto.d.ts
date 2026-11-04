export declare class CreateTaxBracketDto {
    minSalary: number;
    maxSalary?: number;
    rate: number;
    deductible?: number;
    effectiveDate: Date;
    expiryDate?: Date;
}
export declare class UpdateTaxBracketDto {
    minSalary?: number;
    maxSalary?: number;
    rate?: number;
    deductible?: number;
    effectiveDate?: Date;
    expiryDate?: Date;
}
