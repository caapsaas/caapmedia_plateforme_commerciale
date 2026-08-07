import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

export interface CameroonPayrollInput {
  baseSalary: number;
  bonus?: number;
  allowances?: number;
  overtime?: number;
  otherTaxable?: number;
  // Paramètres entreprise
  riskGroup?: 'A' | 'B' | 'C'; // Accidents du travail
  applyCfc?: boolean; // Crédit Foncier (souvent oui)
  applyFne?: boolean;
  // === Phase 4: Cumuls annuels pour calculs progressifs ===
  // Cumuls précédents (si fournis, calculs respectent plafonds/progressivité)
  previousCnpsCumulative?: number; // CNPS cumulatif annuel avant cette paie
  previousIrppCumulative?: number; // IRPP cumulatif annuel avant cette paie
  previousGrossCumulative?: number; // Brut cumulatif annuel avant cette paie
}

export interface CameroonPayrollResult {
  // Rémunération
  baseSalary: number;
  grossSalary: number;

  // Retenues salariales
  cnpsEmployee: number; // 4.2% plafonné
  cfcEmployee: number; // 1%
  irpp: number;
  cac: number; // 10% de l'IRPP
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;

  // Charges patronales
  cnpsEmployerPension: number;
  cnpsFamilyBenefits: number;
  cnpsAccidentRisk: number;
  cfcEmployer: number;
  fne: number;
  totalEmployerCharges: number;
  totalEmployerCost: number;

  // Détail pour le bulletin
  deductionsDetail: { label: string; amount: number; type: string }[];
}

@Injectable()
export class CameroonPayrollCalculatorService {
  // Constantes 2025/2026
  private readonly CNPS_EMPLOYEE_RATE = 0.042;
  private readonly CNPS_EMPLOYER_PENSION = 0.042;
  private readonly CNPS_FAMILY = 0.07;
  private readonly CNPS_CAP = 750_000;
  private readonly CFC_EMPLOYEE = 0.01;
  private readonly CFC_EMPLOYER = 0.015;
  private readonly FNE_RATE = 0.01;
  private readonly PROFESSIONAL_EXPENSE_RATE = 0.3; // 30%
  private readonly FIXED_ABATEMENT_ANNUAL = 500_000;

  private readonly RISK_RATES = {
    A: 0.0175, // faible
    B: 0.025,
    C: 0.05,
  };

  calculate(input: CameroonPayrollInput): CameroonPayrollResult {
    const gross =
      (input.baseSalary || 0) +
      (input.bonus || 0) +
      (input.allowances || 0) +
      (input.overtime || 0) +
      (input.otherTaxable || 0);

    // Base plafonnée CNPS (pour charges patronales, toujours plafonné à 750k)
    const cnpsBase = Math.min(gross, this.CNPS_CAP);

    // === Phase 4: Calcul CNPS avec respect du plafond annuel ===
    const cnpsEmployee = this.calculateCnpsEmployee(
      gross,
      input.previousCnpsCumulative || 0,
    );

    // === Calcul IRPP progressif avec cumul annuel ===
    const cfcEmployee =
      input.applyCfc !== false ? this.round(gross * this.CFC_EMPLOYEE) : 0;

    // Base imposable IRPP
    const afterCnps = gross - cnpsEmployee;
    const professionalExpense = this.round(
      afterCnps * this.PROFESSIONAL_EXPENSE_RATE,
    );
    const monthlyFixedAbatement = this.FIXED_ABATEMENT_ANNUAL / 12;
    const taxableMonthly = Math.max(
      0,
      afterCnps - professionalExpense - monthlyFixedAbatement,
    );
    const taxableAnnual = taxableMonthly * 12;

    // Cumul brut annuel pour base taxable progressive
    const grossCumulativeAnnual = (input.previousGrossCumulative || 0) + gross;

    const { irpp, cac } = this.calculateIrppWithCumulative(
      taxableMonthly,
      grossCumulativeAnnual,
      input.previousIrppCumulative || 0,
    );

    const totalDeductions = cnpsEmployee + cfcEmployee + irpp + cac;
    const netSalary = this.round(gross - totalDeductions);

    // === Charges patronales ===
    const cnpsEmployerPension = this.round(
      cnpsBase * this.CNPS_EMPLOYER_PENSION,
    );
    const cnpsFamilyBenefits = this.round(cnpsBase * this.CNPS_FAMILY);
    const riskRate = this.RISK_RATES[input.riskGroup || 'A'];
    const cnpsAccidentRisk = this.round(cnpsBase * riskRate);
    const cfcEmployer =
      input.applyCfc !== false ? this.round(gross * this.CFC_EMPLOYER) : 0;
    const fne =
      input.applyFne !== false ? this.round(gross * this.FNE_RATE) : 0;

    const totalEmployerCharges =
      cnpsEmployerPension +
      cnpsFamilyBenefits +
      cnpsAccidentRisk +
      cfcEmployer +
      fne;
    const totalEmployerCost = this.round(gross + totalEmployerCharges);

    const deductionsDetail = [
      { label: 'CNPS Pension (4,2%)', amount: cnpsEmployee, type: 'STATUTORY' },
      { label: 'Crédit Foncier (1%)', amount: cfcEmployee, type: 'STATUTORY' },
      { label: 'IRPP', amount: irpp, type: 'STATUTORY' },
      { label: 'CAC (10% IRPP)', amount: cac, type: 'STATUTORY' },
    ].filter((d) => d.amount > 0);

    return {
      baseSalary: input.baseSalary || 0,
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
   * Phase 4: Calculer CNPS avec respect du plafond annuel (750k FCFA).
   * Si le cumul + cette paie dépasse le cap, seul le montant jusqu'au cap est retenu.
   */
  private calculateCnpsEmployee(
    gross: number,
    previousCnpsCumulative: number,
  ): number {
    const cnpsBase = Math.min(gross, this.CNPS_CAP);
    const maxAllowedCnps = this.CNPS_CAP - previousCnpsCumulative;

    if (maxAllowedCnps <= 0) {
      // Plafond atteint, pas de CNPS cette paie
      return 0;
    }

    const cnpsThisPeriod = this.round(cnpsBase * this.CNPS_EMPLOYEE_RATE);
    const actualCnps = Math.min(cnpsThisPeriod, maxAllowedCnps);

    return actualCnps;
  }

  /**
   * Phase 4: Calculer IRPP avec cumul annuel (progressivité).
   * Calcule l'IRPP basé sur le cumul annuel, puis retourne seulement la part de ce mois.
   */
  private calculateIrppWithCumulative(
    taxableMonthly: number,
    grossCumulativeAnnual: number,
    previousIrppCumulative: number,
  ): { irpp: number; cac: number } {
    // Calculer l'impôt total sur le cumul annuel
    const { irppAnnual: totalIrppOnCumulative } = this.calculateIrppAndCac(
      grossCumulativeAnnual * this.PROFESSIONAL_EXPENSE_RATE -
        this.FIXED_ABATEMENT_ANNUAL,
    );

    // La part d'IRPP à retenir ce mois = IRPP total - IRPP précédent
    const irppThisMonth = this.round(
      Math.max(0, totalIrppOnCumulative - previousIrppCumulative),
    );

    const cac = this.round(irppThisMonth * 0.1);

    return { irpp: irppThisMonth, cac };
  }

  private calculateIrppAndCac(taxableAnnual: number): {
    irppAnnual: number;
    cacAnnual: number;
  } {
    let tax = 0;
    let remaining = taxableAnnual;

    const brackets = [
      { limit: 2_000_000, rate: 0.1 },
      { limit: 1_000_000, rate: 0.15 }, // 2M → 3M
      { limit: 2_000_000, rate: 0.25 }, // 3M → 5M
      { limit: Infinity, rate: 0.35 },
    ];

    for (const bracket of brackets) {
      if (remaining <= 0) break;
      const taxableInBracket = Math.min(remaining, bracket.limit);
      tax += taxableInBracket * bracket.rate;
      remaining -= taxableInBracket;
    }

    const irppAnnual = this.round(tax);
    const cacAnnual = this.round(irppAnnual * 0.1);
    return { irppAnnual, cacAnnual };
  }

  /**
   * Résout le salaire de base pour atteindre un salaire net cible, par dichotomie.
   * La fonction netSalary = f(baseSalary) est strictement croissante,
   * donc on peut résoudre par recherche binaire.
   *
   * @param input - Configuration sans baseSalary, avec targetNetSalary au lieu
   * @returns Résultat complet du calcul forward pour le baseSalary trouvé
   */
  calculateFromNetSalary(
    input: Omit<CameroonPayrollInput, 'baseSalary'> & {
      targetNetSalary: number;
    },
  ): CameroonPayrollResult {
    const targetNet = input.targetNetSalary;
    const tolerance = 1; // Tolérance à 1 FCFA
    const maxIterations = 50;

    let low = 0;
    let high = targetNet; // Borne haute initiale : le net cible lui-même

    // Étendre la borne haute jusqu'à trouver une base-salary qui dépasse le net cible
    // (il faut toujours baseSalary > netSalary du fait des déductions)
    let iterations = 0;
    while (
      this.calculate({
        ...input,
        baseSalary: high,
      }).netSalary < targetNet &&
      iterations < 10
    ) {
      high *= 2;
      iterations++;
    }

    // Dichotomie
    iterations = 0;
    let result = this.calculate({ ...input, baseSalary: low });
    while (iterations < maxIterations) {
      const mid = (low + high) / 2;
      result = this.calculate({ ...input, baseSalary: mid });
      const currentNet = result.netSalary;

      if (Math.abs(currentNet - targetNet) <= tolerance) {
        // Convergence atteinte
        break;
      }

      if (currentNet < targetNet) {
        low = mid;
      } else {
        high = mid;
      }

      iterations++;
    }

    // Un dernier calcul avec la valeur finale
    result = this.calculate({
      ...input,
      baseSalary: Math.round(result.baseSalary),
    });
    return result;
  }

  private round(value: number): number {
    return Math.round(value); // FCFA sans centimes
  }
}
