"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CAMEROON_PAYROLL = void 0;
exports.calculateCNPSDeduction = calculateCNPSDeduction;
exports.calculateIRPP = calculateIRPP;
exports.isSalaryBelowSMIG = isSalaryBelowSMIG;
exports.formatCNPSNumber = formatCNPSNumber;
exports.isValidCNPSFormat = isValidCNPSFormat;
exports.CAMEROON_PAYROLL = {
    SMIG_2024: 70000,
    CNPS_EMPLOYEE_RATE: 0.11,
    CNPS_EMPLOYER_RATE: 0.176,
    CNPS_CATEGORIES: {
        A: 'Ouvriers et apprentis / Workers and apprentices',
        B: 'Employés, agents de maîtrise / Employees, supervisory staff',
        C: 'Cadres et assimilés / Managers and equivalent',
        D: 'Travailleurs indépendants / Self-employed',
    },
    IRPP_BRACKETS: [
        { max: 131500, rate: 0, description: 'Exempt' },
        { max: 263000, rate: 0.1, description: '10%' },
        { max: 640250, rate: 0.15, description: '15%' },
        { max: 1150000, rate: 0.25, description: '25%' },
        { max: Infinity, rate: 0.4, description: '40%' },
    ],
    DEPENDENTS_DEDUCTION: 50000,
    LEAVE_ENTITLEMENTS: {
        ANNUAL_PAID: 30,
        SICK_PAID_MAX: 15,
        MATERNITY_PAID: 56,
        PATERNITY_PAID: 3,
        DEATH_IN_FAMILY: 3,
        FAMILY_EVENTS: 3,
    },
    STANDARD_DEDUCTIONS: {
        HEALTH_INSURANCE: 'optional',
        MUTUAL_INSURANCE: 'optional',
    },
};
function calculateCNPSDeduction(grossSalary, category = 'B') {
    const employeeRate = exports.CAMEROON_PAYROLL.CNPS_EMPLOYEE_RATE;
    const employerRate = exports.CAMEROON_PAYROLL.CNPS_EMPLOYER_RATE;
    return {
        employee: Math.round(grossSalary * employeeRate * 100) / 100,
        employer: Math.round(grossSalary * employerRate * 100) / 100,
    };
}
function calculateIRPP(taxableSalary, numberDependents = 0) {
    const dependentsDeduction = Math.min(numberDependents * exports.CAMEROON_PAYROLL.DEPENDENTS_DEDUCTION, taxableSalary * 0.2);
    const finalTaxableSalary = Math.max(0, taxableSalary - dependentsDeduction);
    for (const bracket of exports.CAMEROON_PAYROLL.IRPP_BRACKETS) {
        if (finalTaxableSalary <= bracket.max) {
            return Math.round(finalTaxableSalary * bracket.rate * 100) / 100;
        }
    }
    return 0;
}
function isSalaryBelowSMIG(salary) {
    return salary < exports.CAMEROON_PAYROLL.SMIG_2024;
}
function formatCNPSNumber(cnpsNumber) {
    const cleaned = cnpsNumber.replace(/\D/g, '');
    if (cleaned.length !== 16)
        return cnpsNumber;
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 6)} ${cleaned.slice(6, 10)} ${cleaned.slice(10, 14)} ${cleaned.slice(14)}`;
}
function isValidCNPSFormat(cnpsNumber) {
    const cleaned = cnpsNumber.replace(/\D/g, '');
    return cleaned.length === 16;
}
//# sourceMappingURL=cameroon-payroll.const.js.map