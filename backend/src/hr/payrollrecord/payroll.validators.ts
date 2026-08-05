/**
 * VALIDATEURS DE PAIE - Normes Camerounaises
 *
 * Validations légales pour garantir conformité avec:
 * - Code du Travail camerounais
 * - Normes CNPS/DGI/MINELT
 */

import { BadRequestException } from '@nestjs/common';
import { PAYROLL_CONSTANTS } from './payroll.constants';

export class PayrollValidators {
  /**
   * Validation SMIG (Salaire Minimum Interprofessionnel Garanti)
   */
  static validateSMIG(baseSalary: number, year: number = 2026): void {
    let smigValue: number;

    switch (year) {
      case 2024:
        smigValue = PAYROLL_CONSTANTS.SMIG.value_2024;
        break;
      case 2025:
        smigValue = PAYROLL_CONSTANTS.SMIG.value_2025;
        break;
      case 2026:
      default:
        smigValue = PAYROLL_CONSTANTS.SMIG.value_2026;
        break;
    }

    if (smigValue === 0) {
      console.warn(
        `⚠️ SMIG ${year} non configuré (valeur = 0). Validation SMIG désactivée.`,
      );
      return;
    }

    if (baseSalary < smigValue) {
      throw new BadRequestException(
        `Salaire ${baseSalary} FCFA inférieur au SMIG ${smigValue} FCFA (${year}).`,
      );
    }
  }

  /**
   * Validation plafond CNPS
   */
  static validateCNPSCap(salary: number, year: number = 2026): number {
    const cap = PAYROLL_CONSTANTS.CNPS.CAP.value_2026;
    return Math.min(salary, cap);
  }

  /**
   * Validation heures de travail
   */
  static validateWorkingHours(
    weekdayHours: number,
    sundayHours: number = 0,
    holidayHours: number = 0,
  ): {
    regularHours: number;
    sundayHours: number;
    holidayHours: number;
    overtimeMultiplier: number;
  } {
    const MAX_REGULAR_HOURS = 40;

    if (weekdayHours < 0) {
      throw new BadRequestException(
        `Heures de travail négatives: ${weekdayHours}`,
      );
    }

    if (weekdayHours > MAX_REGULAR_HOURS) {
      const overtimeHours = weekdayHours - MAX_REGULAR_HOURS;
      console.warn(
        `⚠️ ${overtimeHours}h en excès du maximum légal (40h/semaine)`,
      );
    }

    return {
      regularHours: Math.min(weekdayHours, MAX_REGULAR_HOURS),
      sundayHours,
      holidayHours,
      overtimeMultiplier: 1.0,
    };
  }

  /**
   * Validation avances sur salaire (max 50%)
   */
  static validateAdvanceDeduction(
    salaryAdvance: number,
    grossSalary: number,
  ): void {
    const MAX_ADVANCE_PERCENTAGE = 0.5;
    const maxAllowedAdvance = grossSalary * MAX_ADVANCE_PERCENTAGE;

    if (salaryAdvance > maxAllowedAdvance) {
      throw new BadRequestException(
        `Avance ${salaryAdvance} FCFA dépasse le maximum autorisé (50% = ${maxAllowedAdvance}).`,
      );
    }
  }

  /**
   * Validation cotisations retraite privée (max 15%)
   */
  static validateRetirementContribution(
    contribution: number,
    grossSalary: number,
  ): void {
    const MAX_RETIREMENT_PERCENTAGE = 0.15;
    const maxAllowed = grossSalary * MAX_RETIREMENT_PERCENTAGE;

    if (contribution > maxAllowed) {
      throw new BadRequestException(
        `Cotisation retraite ${contribution} FCFA dépasse le maximum (15% = ${maxAllowed})`,
      );
    }
  }

  /**
   * Validation période de paie (YYYY-MM)
   */
  static validatePayrollPeriod(period: string): boolean {
    const regex = /^\d{4}-\d{2}$/;
    if (!regex.test(period)) {
      throw new BadRequestException(
        `Format période invalide: "${period}". Utilisez YYYY-MM (ex: 2026-08).`,
      );
    }

    const [year, month] = period.split('-').map(Number);
    if (month < 1 || month > 12) {
      throw new BadRequestException(
        `Mois invalide: ${month}. Doit être entre 01-12.`,
      );
    }

    return true;
  }

  /**
   * Validation statut employé (doit être ACTIVE)
   */
  static validateEmployeeStatus(status: string): boolean {
    const ACTIVE_STATUS = 'ACTIVE';
    if (status !== ACTIVE_STATUS) {
      throw new BadRequestException(
        `Employé avec statut "${status}" ne peut pas être payé. Statut requis: ${ACTIVE_STATUS}.`,
      );
    }
    return true;
  }

  /**
   * Validation groupe risque (A, B, C)
   */
  static validateRiskGroup(
    riskGroup: 'A' | 'B' | 'C' | undefined,
  ): 'A' | 'B' | 'C' {
    if (!riskGroup || !['A', 'B', 'C'].includes(riskGroup)) {
      return 'A';
    }
    return riskGroup;
  }

  /**
   * Validation aucun montant négatif
   */
  static validateNoNegativeAmounts(payrollData: Record<string, number>): void {
    const negativeFields = Object.entries(payrollData)
      .filter(([, value]) => value < 0)
      .map(([key]) => key);

    if (negativeFields.length > 0) {
      throw new BadRequestException(
        `Montants négatifs détectés: ${negativeFields.join(', ')}.`,
      );
    }
  }

  /**
   * Validation cohérence brut/net
   */
  static validateNetSalaryCoherence(
    grossSalary: number,
    netSalary: number,
  ): void {
    if (netSalary > grossSalary) {
      throw new BadRequestException(
        `Incohérence: Salaire net (${netSalary}) > brut (${grossSalary}).`,
      );
    }

    if (netSalary < 0) {
      throw new BadRequestException(
        `Salaire net négatif: ${netSalary}. Les retenues ne peuvent pas dépasser le brut.`,
      );
    }
  }
}
