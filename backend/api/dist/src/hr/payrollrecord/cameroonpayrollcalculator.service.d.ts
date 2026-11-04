export interface CameroonPayrollInput {
    baseSalary: number;
    bonus?: number;
    allowances?: number;
    overtime?: number;
    otherTaxable?: number;
    riskGroup?: 'A' | 'B' | 'C';
    applyCfc?: boolean;
    applyFne?: boolean;
    previousCnpsCumulative?: number;
    previousIrppCumulative?: number;
    previousGrossCumulative?: number;
    payrollConfig?: {
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
    };
}
export interface CameroonPayrollResult {
    baseSalary: number;
    grossSalary: number;
    cnpsEmployee: number;
    cfcEmployee: number;
    irpp: number;
    cac: number;
    otherDeductions: number;
    totalDeductions: number;
    netSalary: number;
    cnpsEmployerPension: number;
    cnpsFamilyBenefits: number;
    cnpsAccidentRisk: number;
    cfcEmployer: number;
    fne: number;
    totalEmployerCharges: number;
    totalEmployerCost: number;
    deductionsDetail: {
        label: string;
        amount: number;
        type: string;
    }[];
}
export declare class CameroonPayrollCalculatorService {
    private readonly CNPS_EMPLOYEE_RATE;
    private readonly CNPS_EMPLOYER_PENSION;
    private readonly CNPS_FAMILY;
    private readonly CNPS_CAP;
    private readonly CFC_EMPLOYEE;
    private readonly CFC_EMPLOYER;
    private readonly FNE_RATE;
    private readonly PROFESSIONAL_EXPENSE_RATE;
    private readonly FIXED_ABATEMENT_ANNUAL;
    private readonly RISK_RATES;
    calculate(input: CameroonPayrollInput): CameroonPayrollResult;
    private calculateCnpsEmployee;
    private calculateIrppWithCumulative;
    private calculateIrppAndCac;
    calculateFromNetSalary(input: Omit<CameroonPayrollInput, 'baseSalary'> & {
        targetNetSalary: number;
    }): CameroonPayrollResult;
    private round;
}
