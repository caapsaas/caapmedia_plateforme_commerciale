/**
 * Cameroon Payroll Configuration 2024
 * Based on Code du Travail Camerounais and CNPS regulations
 */

export const CAMEROON_PAYROLL = {
  // Salaire Minimum Interprofessionnel Garanti (SMIG)
  SMIG_2024: 70000, // FCFA/month (as of 2024)

  // CNPS (Caisse Nationale de Prévoyance Sociale) rates
  CNPS_EMPLOYEE_RATE: 0.11, // 11% employee contribution
  CNPS_EMPLOYER_RATE: 0.176, // 17.6% employer contribution (patronale)

  // CNPS Category codes (affects contribution rates)
  CNPS_CATEGORIES: {
    A: 'Ouvriers et apprentis / Workers and apprentices',
    B: 'Employés, agents de maîtrise / Employees, supervisory staff',
    C: 'Cadres et assimilés / Managers and equivalent',
    D: 'Travailleurs indépendants / Self-employed',
  },

  // IRPP (Impôt sur le Revenu des Personnes Physiques) tax brackets 2024
  IRPP_BRACKETS: [
    { max: 131500, rate: 0, description: 'Exempt' },
    { max: 263000, rate: 0.1, description: '10%' },
    { max: 640250, rate: 0.15, description: '15%' },
    { max: 1150000, rate: 0.25, description: '25%' },
    { max: Infinity, rate: 0.4, description: '40%' },
  ],

  // Tax deductions per dependent
  DEPENDENTS_DEDUCTION: 50000, // FCFA per dependent per month (reduces taxable basis)

  // Leave entitlements (Code du Travail)
  LEAVE_ENTITLEMENTS: {
    ANNUAL_PAID: 30, // Minimum 30 days/year (2.5 days/month accrual)
    SICK_PAID_MAX: 15, // Max 15 days/year paid
    MATERNITY_PAID: 56, // 8 weeks (56 days) mandatory paid leave
    PATERNITY_PAID: 3, // 3 days paid (recent addition)
    DEATH_IN_FAMILY: 3, // 3 days for death in family
    FAMILY_EVENTS: 3, // 3 days for family events/wedding
  },

  // Standard deductions from gross salary
  STANDARD_DEDUCTIONS: {
    // Health insurance (exemple - à adapter selon l'entreprise)
    HEALTH_INSURANCE: 'optional',
    // Mutual insurance (caisse de mutualité - optional)
    MUTUAL_INSURANCE: 'optional',
  },
};

/**
 * Calculate CNPS deduction for employee
 */
export function calculateCNPSDeduction(grossSalary: number, category: string = 'B'): {
  employee: number;
  employer: number;
} {
  // Category B is default (Employés, agents de maîtrise)
  const employeeRate = CAMEROON_PAYROLL.CNPS_EMPLOYEE_RATE;
  const employerRate = CAMEROON_PAYROLL.CNPS_EMPLOYER_RATE;

  return {
    employee: Math.round(grossSalary * employeeRate * 100) / 100,
    employer: Math.round(grossSalary * employerRate * 100) / 100,
  };
}

/**
 * Calculate IRPP (income tax) based on taxable salary
 * Taxable salary = Gross - CNPS employee contribution - dependents deduction
 */
export function calculateIRPP(
  taxableSalary: number,
  numberDependents: number = 0
): number {
  // Apply dependents deduction
  const dependentsDeduction = Math.min(
    numberDependents * CAMEROON_PAYROLL.DEPENDENTS_DEDUCTION,
    taxableSalary * 0.2 // Cap at 20% of taxable salary
  );
  const finalTaxableSalary = Math.max(0, taxableSalary - dependentsDeduction);

  // Find applicable bracket and calculate tax
  for (const bracket of CAMEROON_PAYROLL.IRPP_BRACKETS) {
    if (finalTaxableSalary <= bracket.max) {
      return Math.round(finalTaxableSalary * bracket.rate * 100) / 100;
    }
  }

  return 0;
}

/**
 * Check if salary is below SMIG
 */
export function isSalaryBelowSMIG(salary: number): boolean {
  return salary < CAMEROON_PAYROLL.SMIG_2024;
}

/**
 * Format CNPS number as XX XXXX XXXX XXXX
 */
export function formatCNPSNumber(cnpsNumber: string): string {
  const cleaned = cnpsNumber.replace(/\D/g, '');
  if (cleaned.length !== 16) return cnpsNumber; // Invalid length, return as-is
  return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 6)} ${cleaned.slice(6, 10)} ${cleaned.slice(10, 14)} ${cleaned.slice(14)}`;
}

/**
 * Validate CNPS number format (should be 16 digits: XX XXXX XXXX XXXX)
 */
export function isValidCNPSFormat(cnpsNumber: string): boolean {
  const cleaned = cnpsNumber.replace(/\D/g, '');
  return cleaned.length === 16;
}
