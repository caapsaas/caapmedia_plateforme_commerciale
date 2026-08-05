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
   * ============================================================================
   * 1. VALIDATION SMIG (Salaire Minimum Interprofessionnel Garanti)
   * ============================================================================
   *
   * Définition: Aucun salaire ne peut être < SMIG
   *
   * STATUS: ❓ À IMPLÉMENTER APRÈS confirmation MINELT
   * CONTACT: MINELT www.minelt.gov.cm
   *
   * TODO: Remplir SMIG_2024, SMIG_2025, SMIG_2026 dans constantes
   */

  static validateSMIG(baseSalary: number, year: number = 2026): void {
    // Récupérer le SMIG pour l'année
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

    // Si SMIG = 0, il n'a pas été rempli → Skip validation
    if (smigValue === 0) {
      console.warn(
        `⚠️ SMIG ${year} non configuré (valeur = 0). Validation SMIG désactivée.`,
      );
      return;
    }

    // Vérifier que le salaire ≥ SMIG
    if (baseSalary < smigValue) {
      throw new BadRequestException(
        `Salaire ${baseSalary} FCFA inférieur au SMIG ${smigValue} FCFA (${year}). ` +
          `Référence légale: Code du Travail Camerounais.`,
      );
    }
  }

  /**
   * ============================================================================
   * 2. VALIDATION PLAFOND CNPS
   * ============================================================================
   *
   * Définition: Aucune cotisation CNPS au-delà du plafond
   *
   * STATUS: ✅ FONCTIONNEL (mais plafond à confirmer)
   *
   * NOTE: Cette validation s'exécute automatiquement dans le calculateur
   */

  static validateCNPSCap(salary: number, year: number = 2026): number {
    // Retourner le minimum (salary, cnps cap)
    const cap = PAYROLL_CONSTANTS.CNPS.CAP.value_2026;
    return Math.min(salary, cap);
  }

  /**
   * ============================================================================
   * 3. VALIDATION HEURES (À IMPLÉMENTER PHASE 2)
   * ============================================================================
   *
   * Définition: Heures légales + heures sup avec majorations
   *
   * STATUS: ❌ À IMPLÉMENTER
   *
   * Règles:
   * - 40 heures/semaine (standard Cameroun)
   * - Heures sup: +25% jour, +50% dimanche, +100% férié
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
    const MAX_REGULAR_HOURS = 40; // par semaine

    if (weekdayHours < 0) {
      throw new BadRequestException(
        `Heures de travail négatives: ${weekdayHours}`,
      );
    }

    if (weekdayHours > MAX_REGULAR_HOURS) {
      // Les heures en excès deviennent heures sup (25% majoration)
      const overtimeHours = weekdayHours - MAX_REGULAR_HOURS;
      console.warn(
        `⚠️ ${overtimeHours}h en excès du maximum légal (40h/semaine)`,
      );
    }

    return {
      regularHours: Math.min(weekdayHours, MAX_REGULAR_HOURS),
      sundayHours,
      holidayHours,
      overtimeMultiplier: 1.0, // À calculer selon type
    };
  }

  /**
   * ============================================================================
   * 4. VALIDATION AVANCES SUR SALAIRE
   * ============================================================================
   *
   * Définition: Pas de retenue > 50% du salaire pour avances
   *
   * STATUS: À IMPLÉMENTER PHASE 2
   */

  static validateAdvanceDeduction(
    salaryAdvance: number,
    grossSalary: number,
  ): void {
    const MAX_ADVANCE_PERCENTAGE = 0.5; // 50% max
    const maxAllowedAdvance = grossSalary * MAX_ADVANCE_PERCENTAGE;

    if (salaryAdvance > maxAllowedAdvance) {
      throw new BadRequestException(
        `Avance ${salaryAdvance} FCFA dépasse le maximum autorisé (50% = ${maxAllowedAdvance}). ` +
          `Code du Travail Art. X.`,
      );
    }
  }

  /**
   * ============================================================================
   * 5. VALIDATION COTISATIONS RETRAITE PRIVÉE
   * ============================================================================
   *
   * Définition: Cotisations IRPP/retraite optionnelles doivent être raisonnables
   *
   * STATUS: À IMPLÉMENTER PHASE 2
   */

  static validateRetirementContribution(
    contribution: number,
    grossSalary: number,
  ): void {
    const MAX_RETIREMENT_PERCENTAGE = 0.15; // 15% max (exemple)
    const maxAllowed = grossSalary * MAX_RETIREMENT_PERCENTAGE;

    if (contribution > maxAllowed) {
      throw new BadRequestException(
        `Cotisation retraite ${contribution} FCFA dépasse le maximum (15% = ${maxAllowed})`,
      );
    }
  }

  /**
   * ============================================================================
   * 6. VALIDATION PÉRIODE DE PAIE
   * ============================================================================
   *
   * Définition: Format YYYY-MM valide
   *
   * STATUS: ✅ FONCTIONNEL
   */

  static validatePayrollPeriod(period: string): boolean {
    const regex = /^\d{4}-\d{2}$/; // YYYY-MM
    if (!regex.test(period)) {
      throw new BadRequestException(
        `Format période invalide: "${period}". ` +
          `Utilisez YYYY-MM (ex: 2026-08).`,
      );
    }

    // Vérifier que mois est 01-12
    const [year, month] = period.split('-').map(Number);
    if (month < 1 || month > 12) {
      throw new BadRequestException(
        `Mois invalide: ${month}. Doit être entre 01-12.`,
      );
    }

    return true;
  }

  /**
   * ============================================================================
   * 7. VALIDATION EMPLOYÉ ACTIF
   * ============================================================================
   *
   * Définition: Seuls employés ACTIVE génèrent paie
   *
   * STATUS: ✅ FONCTIONNEL
   */

  static validateEmployeeStatus(status: string): boolean {
    const ACTIVE_STATUS = 'ACTIVE';
    if (status !== ACTIVE_STATUS) {
      throw new BadRequestException(
        `Employé avec statut "${status}" ne peut pas être payé. ` +
          `Statut requis: ${ACTIVE_STATUS}.`,
      );
    }
    return true;
  }

  /**
   * ============================================================================
   * 8. VALIDATION GROUPE RISQUE
   * ============================================================================
   *
   * Définition: Groupe A, B ou C (accidents du travail)
   *
   * STATUS: ✅ FONCTIONNEL
   */

  static validateRiskGroup(
    riskGroup: 'A' | 'B' | 'C' | undefined,
  ): 'A' | 'B' | 'C' {
    if (!riskGroup || !['A', 'B', 'C'].includes(riskGroup)) {
      return 'A'; // Défaut: groupe faible risque
    }
    return riskGroup;
  }

  /**
   * ============================================================================
   * 9. VALIDATION MONTANTS NÉGATIFS
   * ============================================================================
   *
   * Définition: Aucun montant ne doit être négatif
   *
   * STATUS: ✅ FONCTIONNEL
   */

  static validateNoNegativeAmounts(payrollData: Record<string, number>): void {
    const negativeFields = Object.entries(payrollData)
      .filter(([, value]) => value < 0)
      .map(([key]) => key);

    if (negativeFields.length > 0) {
      throw new BadRequestException(
        `Montants négatifs détectés: ${negativeFields.join(', ')}. ` +
          `Tous les montants doivent être ≥ 0.`,
      );
    }
  }

  /**
   * ============================================================================
   * 10. VALIDATION COHÉRENCE BRUT/NET
   * ============================================================================
   *
   * Définition: Salaire net doit être < brut
   *
   * STATUS: ✅ FONCTIONNEL
   */

  static validateNetSalaryCoherence(
    grossSalary: number,
    netSalary: number,
  ): void {
    if (netSalary > grossSalary) {
      throw new BadRequestException(
        `Incohérence: Salaire net (${netSalary}) > brut (${grossSalary}). ` +
          `Vérifier les calculs.`,
      );
    }

    if (netSalary < 0) {
      throw new BadRequestException(
        `Salaire net négatif: ${netSalary}. ` +
          `Les retenues ne peuvent pas dépasser le brut.`,
      );
    }
  }

  /**
   * ============================================================================
   * 11. VALIDATION DOUBLON PAIE
   * ============================================================================
   *
   * Définition: Pas de fiche de paie double pour même employé/période
   *
   * STATUS: ✅ FONCTIONNEL (géré en base avec unique constraint)
   *
   * NOTE: Cette validation se fait au niveau base de données
   * (unique constraint sur employeeId + payrollPeriod)
   */

  // Pas de logique ici, c'est géré par la base
}

/**
 * ============================================================================
 * CHECKLIST VALIDATIONS PHASE 2
 * ============================================================================
 *
 * - [ ] Remplir SMIG_2024, SMIG_2025, SMIG_2026 dans constantes
 * - [ ] Tester validation SMIG
 * - [ ] Implémenter heures supplémentaires (25%/50%/100%)
 * - [ ] Implémenter avances sur salaire
 * - [ ] Implémenter cotisations retraite privée
 * - [ ] Ajouter tests pour chaque validation
 * - [ ] Tester combinaisons (ex: heures sup + SMIG)
 *
 * Dependencies:
 * - MINELT: Confirmation SMIG
 * - MINELT: Règles heures supplémentaires
 * - CNPS: Limites avances
 */
