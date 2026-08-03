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
  applyCfc?: boolean;         // Crédit Foncier (souvent oui)
  applyFne?: boolean;
}

export interface CameroonPayrollResult {
  // Brut
  grossSalary: number;

  // Retenues salariales
  cnpsEmployee: number;       // 4.2% plafonné
  cfcEmployee: number;        // 1%
  irpp: number;
  cac: number;                // 10% de l'IRPP
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
  private readonly PROFESSIONAL_EXPENSE_RATE = 0.30; // 30%
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

    // Base plafonnée CNPS
    const cnpsBase = Math.min(gross, this.CNPS_CAP);

    // === Retenues salariales ===
    const cnpsEmployee = this.round(cnpsBase * this.CNPS_EMPLOYEE_RATE);
    const cfcEmployee = input.applyCfc !== false ? this.round(gross * this.CFC_EMPLOYEE) : 0;

    // Base imposable IRPP (simplification courante)
    // Brut - CNPS - abattement 30% - abattement fixe annuel / 12
    const afterCnps = gross - cnpsEmployee;
    const professionalExpense = this.round(afterCnps * this.PROFESSIONAL_EXPENSE_RATE);
    const monthlyFixedAbatement = this.FIXED_ABATEMENT_ANNUAL / 12;
    const taxableMonthly = Math.max(0, afterCnps - professionalExpense - monthlyFixedAbatement);
    const taxableAnnual = taxableMonthly * 12;

    const { irppAnnual, cacAnnual } = this.calculateIrppAndCac(taxableAnnual);
    const irpp = this.round(irppAnnual / 12);
    const cac = this.round(cacAnnual / 12);

    const totalDeductions = cnpsEmployee + cfcEmployee + irpp + cac;
    const netSalary = this.round(gross - totalDeductions);

    // === Charges patronales ===
    const cnpsEmployerPension = this.round(cnpsBase * this.CNPS_EMPLOYER_PENSION);
    const cnpsFamilyBenefits = this.round(cnpsBase * this.CNPS_FAMILY);
    const riskRate = this.RISK_RATES[input.riskGroup || 'A'];
    const cnpsAccidentRisk = this.round(cnpsBase * riskRate);
    const cfcEmployer = input.applyCfc !== false ? this.round(gross * this.CFC_EMPLOYER) : 0;
    const fne = input.applyFne !== false ? this.round(gross * this.FNE_RATE) : 0;

    const totalEmployerCharges =
      cnpsEmployerPension + cnpsFamilyBenefits + cnpsAccidentRisk + cfcEmployer + fne;
    const totalEmployerCost = this.round(gross + totalEmployerCharges);

    const deductionsDetail = [
      { label: 'CNPS Pension (4,2%)', amount: cnpsEmployee, type: 'STATUTORY' },
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

  private calculateIrppAndCac(taxableAnnual: number): { irppAnnual: number; cacAnnual: number } {
    let tax = 0;
    let remaining = taxableAnnual;

    const brackets = [
      { limit: 2_000_000, rate: 0.10 },
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
    const cacAnnual = this.round(irppAnnual * 0.10);
    return { irppAnnual, cacAnnual };
  }

  private round(value: number): number {
    return Math.round(value); // FCFA sans centimes
  }
}