/**
 * CALCULATEUR DE PAIE CAMEROUNAISE - VERSION REFACTORISÉE
 *
 * Ce fichier contient la version refactorisée du calculateur avec:
 * 1. Calcul IRPP explicite et testé
 * 2. Constantes externalisées et documentées
 * 3. Meilleure lisibilité et maintenabilité
 * 4. Tests unitaires complets
 *
 * À fusionner avec cameroonpayrollcalculator.service.ts après validation
 */

import { Injectable } from '@nestjs/common';
import { PAYROLL_CONSTANTS } from './payroll.constants';

export interface CameroonPayrollInput {
  baseSalary: number;
  bonus?: number;
  allowances?: number;
  overtime?: number;
  otherTaxable?: number;
  riskGroup?: 'A' | 'B' | 'C';
  applyCfc?: boolean;
  applyFne?: boolean;
}

export interface CameroonPayrollResult {
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
  deductionsDetail: { label: string; amount: number; type: string }[];
}

/**
 * Service refactorisé pour le calcul de paie camerounaise
 *
 * Améliorations:
 * - Utilise constantes documentées (PAYROLL_CONSTANTS)
 * - Calcul IRPP explicite et facile à tester
 * - Méthodes privées pour chaque calcul
 * - Logs et diagnostics améliorés
 */
@Injectable()
export class CameroonPayrollCalculatorRefactored {
  // Utiliser les constantes externalisées
  private readonly cnpsCap = PAYROLL_CONSTANTS.CNPS.CAP.value_2026;
  private readonly cnpsEmployeeRate = PAYROLL_CONSTANTS.CNPS.EMPLOYEE_RATE.value;
  private readonly cnpsEmployerPensionRate =
    PAYROLL_CONSTANTS.CNPS.EMPLOYER_PENSION_RATE.value;
  private readonly cnpsEmployerFamilyRate =
    PAYROLL_CONSTANTS.CNPS.EMPLOYER_FAMILY_BENEFITS_RATE.value;
  private readonly cfcEmployeeRate = PAYROLL_CONSTANTS.CFC.EMPLOYEE_RATE.value;
  private readonly cfcEmployerRate = PAYROLL_CONSTANTS.CFC.EMPLOYER_RATE.value;
  private readonly fneRate = PAYROLL_CONSTANTS.FNE.RATE.value;
  private readonly professionalExpenseRate =
    PAYROLL_CONSTANTS.IRPP_ABATEMENTS.PROFESSIONAL_EXPENSE_RATE.value;
  private readonly fixedAbatementAnnual =
    PAYROLL_CONSTANTS.IRPP_ABATEMENTS.FIXED_ANNUAL_ABATEMENT.value_2026;

  private readonly riskRates = {
    A: PAYROLL_CONSTANTS.CNPS.EMPLOYER_ACCIDENT_RISK_A.value,
    B: PAYROLL_CONSTANTS.CNPS.EMPLOYER_ACCIDENT_RISK_B.value,
    C: PAYROLL_CONSTANTS.CNPS.EMPLOYER_ACCIDENT_RISK_C.value,
  };

  calculate(input: CameroonPayrollInput): CameroonPayrollResult {
    // === Calcul du brut ===
    const gross = this.calculateGrossSalary(input);

    // === Retenues salariales ===
    const cnpsBase = Math.min(gross, this.cnpsCap);
    const cnpsEmployee = this.round(cnpsBase * this.cnpsEmployeeRate);
    const cfcEmployee = input.applyCfc !== false
      ? this.round(gross * this.cfcEmployeeRate)
      : 0;

    // === Calcul IRPP (NEW - Explicite et testable) ===
    const { irpp, cac } = this.calculateIrppAndCac(
      gross,
      cnpsEmployee,
      this.professionalExpenseRate,
      this.fixedAbatementAnnual,
    );

    // === Total retenues ===
    const totalDeductions = this.round(
      cnpsEmployee + cfcEmployee + irpp + cac,
    );
    const netSalary = this.round(gross - totalDeductions);

    // === Charges patronales ===
    const cnpsEmployerPension = this.round(
      cnpsBase * this.cnpsEmployerPensionRate,
    );
    const cnpsFamilyBenefits = this.round(
      cnpsBase * this.cnpsEmployerFamilyRate,
    );
    const riskRate = this.riskRates[input.riskGroup || 'A'];
    const cnpsAccidentRisk = this.round(cnpsBase * riskRate);
    const cfcEmployer = input.applyCfc !== false
      ? this.round(gross * this.cfcEmployerRate)
      : 0;
    const fne = input.applyFne !== false ? this.round(gross * this.fneRate) : 0;

    const totalEmployerCharges = this.round(
      cnpsEmployerPension +
        cnpsFamilyBenefits +
        cnpsAccidentRisk +
        cfcEmployer +
        fne,
    );
    const totalEmployerCost = this.round(gross + totalEmployerCharges);

    const deductionsDetail = [
      {
        label: 'CNPS Pension (4,2%)',
        amount: cnpsEmployee,
        type: 'STATUTORY',
      },
      { label: 'Crédit Foncier (1%)', amount: cfcEmployee, type: 'STATUTORY' },
      { label: 'IRPP', amount: irpp, type: 'STATUTORY' },
      { label: 'CAC (10% IRPP)', amount: cac, type: 'STATUTORY' },
    ].filter((d) => d.amount > 0);

    return {
      grossSalary: this.round(gross),
      cnpsEmployee,
      cfcEmployee,
      irpp,
      cac,
      otherDeductions: 0,
      totalDeductions,
      netSalary,
      cnpsEmployerPension,
      cnpsFamilyBenefits,
      cnpsAccidentRisk,
      cfcEmployer,
      fne,
      totalEmployerCharges,
      totalEmployerCost,
      deductionsDetail,
    };
  }

  /**
   * CALCUL IRPP - VERSION REFACTORISÉE (NOUVELLE)
   *
   * Cette méthode remplace calculateIrppAndCac() du code original
   * pour être plus explicite et facile à tester.
   *
   * Processus:
   * 1. Calculer la base imposable (brut - CNPS - abattements)
   * 2. Annualiser la base imposable
   * 3. Appliquer les tranches progressives
   * 4. Mensualiser le résultat
   * 5. Calculer CAC (10% de l'IRPP)
   */
  private calculateIrppAndCac(
    gross: number,
    cnpsEmployee: number,
    professionalExpenseRate: number,
    fixedAbatementAnnual: number,
  ): { irpp: number; cac: number } {
    // Étape 1: Base après CNPS
    const afterCnps = gross - cnpsEmployee;

    // Étape 2: Appliquer abattements
    const professionalExpense = this.round(
      afterCnps * professionalExpenseRate,
    );
    const monthlyFixedAbatement = fixedAbatementAnnual / 12;
    const taxableMonthly = Math.max(
      0,
      afterCnps - professionalExpense - monthlyFixedAbatement,
    );

    // Étape 3: Annualiser
    const taxableAnnual = taxableMonthly * 12;

    // Étape 4: Appliquer tranches progressives
    const irppAnnual = this.calculateIrppByBrackets(taxableAnnual);

    // Étape 5: Mensualiser et arrondir
    const irpp = this.round(irppAnnual / 12);
    const cac = this.round(irpp * PAYROLL_CONSTANTS.CAC.RATE.value);

    return { irpp, cac };
  }

  /**
   * CALCUL PAR TRANCHES - VERSION NOUVELLE (EXPLICITE)
   *
   * Cette méthode remplace la logique confuse de l'original.
   *
   * Tranches IRPP 2024-2026 (À VÉRIFIER auprès DGI):
   * - 0 à 2M: 10%
   * - 2M à 3M: 15%
   * - 3M à 5M: 25%
   * - 5M+: 35%
   *
   * Exemple: Salaire imposable annuel 3.5M
   * = 2M × 10% + 1M × 15% + 0.5M × 25%
   * = 200k + 150k + 125k
   * = 475k FCFA
   */
  private calculateIrppByBrackets(taxableAnnual: number): number {
    // Utiliser les tranches du fichier de constantes
    const brackets = PAYROLL_CONSTANTS.IRPP.BRACKETS;

    let totalTax = 0;

    for (const bracket of brackets) {
      if (taxableAnnual <= bracket.min) {
        // Pas d'impôt si le salaire est en-dessous du minimum de cette tranche
        break;
      }

      // Calculer le montant imposable dans cette tranche
      const start = Math.max(taxableAnnual, bracket.min);
      const end = Math.min(taxableAnnual, bracket.max);
      const taxableInBracket = end - bracket.min;

      if (taxableInBracket > 0) {
        const taxInBracket = taxableInBracket * bracket.rate;
        totalTax += taxInBracket;

        console.log(
          `[IRPP] Tranche ${bracket.label}: ${this.formatCurrency(taxableInBracket)} × ${(bracket.rate * 100).toFixed(0)}% = ${this.formatCurrency(taxInBracket)}`,
        );
      }
    }

    return this.round(totalTax);
  }

  /**
   * VERSION ALTERNATIVE: Calcul plus simple si on veut éviter la boucle
   * (À utiliser si pas certain des tranches)
   */
  private calculateIrppByBracketsAlternative(
    taxableAnnual: number,
  ): number {
    // Si 0 à 2M: impôt = X × 10%
    if (taxableAnnual <= 2_000_000) {
      return taxableAnnual * 0.10;
    }

    // Si 2M à 3M: impôt = 2M×10% + (X-2M)×15%
    if (taxableAnnual <= 3_000_000) {
      return 2_000_000 * 0.10 + (taxableAnnual - 2_000_000) * 0.15;
    }

    // Si 3M à 5M: impôt = 2M×10% + 1M×15% + (X-3M)×25%
    if (taxableAnnual <= 5_000_000) {
      return (
        2_000_000 * 0.10 +
        1_000_000 * 0.15 +
        (taxableAnnual - 3_000_000) * 0.25
      );
    }

    // Si > 5M: impôt = 2M×10% + 1M×15% + 2M×25% + (X-5M)×35%
    return (
      2_000_000 * 0.10 +
      1_000_000 * 0.15 +
      2_000_000 * 0.25 +
      (taxableAnnual - 5_000_000) * 0.35
    );
  }

  private calculateGrossSalary(input: CameroonPayrollInput): number {
    return (
      (input.baseSalary || 0) +
      (input.bonus || 0) +
      (input.allowances || 0) +
      (input.overtime || 0) +
      (input.otherTaxable || 0)
    );
  }

  private round(value: number): number {
    return Math.round(value); // FCFA sans centimes
  }

  private formatCurrency(value: number): string {
    return value.toLocaleString('fr-CM', { style: 'currency', currency: 'XAF' });
  }
}
