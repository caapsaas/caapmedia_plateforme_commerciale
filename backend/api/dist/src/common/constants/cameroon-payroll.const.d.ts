export declare const CAMEROON_PAYROLL: {
    SMIG_2024: number;
    CNPS_EMPLOYEE_RATE: number;
    CNPS_EMPLOYER_RATE: number;
    CNPS_CATEGORIES: {
        A: string;
        B: string;
        C: string;
        D: string;
    };
    IRPP_BRACKETS: {
        max: number;
        rate: number;
        description: string;
    }[];
    DEPENDENTS_DEDUCTION: number;
    LEAVE_ENTITLEMENTS: {
        ANNUAL_PAID: number;
        SICK_PAID_MAX: number;
        MATERNITY_PAID: number;
        PATERNITY_PAID: number;
        DEATH_IN_FAMILY: number;
        FAMILY_EVENTS: number;
    };
    STANDARD_DEDUCTIONS: {
        HEALTH_INSURANCE: string;
        MUTUAL_INSURANCE: string;
    };
};
export declare function calculateCNPSDeduction(grossSalary: number, category?: string): {
    employee: number;
    employer: number;
};
export declare function calculateIRPP(taxableSalary: number, numberDependents?: number): number;
export declare function isSalaryBelowSMIG(salary: number): boolean;
export declare function formatCNPSNumber(cnpsNumber: string): string;
export declare function isValidCNPSFormat(cnpsNumber: string): boolean;
