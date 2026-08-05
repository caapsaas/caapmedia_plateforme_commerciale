/**
 * TESTS UNITAIRES - Validateurs de Paie Phase 2
 */

import { BadRequestException } from '@nestjs/common';
import { PayrollValidators } from './payroll.validators';

describe('PayrollValidators', () => {
  describe('Validation SMIG', () => {
    test('SMIG: Salaire >= SMIG → Accepté', () => {
      expect(() => {
        PayrollValidators.validateSMIG(2_000_000, 2026);
      }).not.toThrow();

      console.log('✅ SMIG validation OK (pas encore configuré)');
    });
  });

  describe('Validation Heures', () => {
    test('Heures: 40h semaine → Accepté', () => {
      const result = PayrollValidators.validateWorkingHours(40, 0, 0);

      expect(result.regularHours).toBe(40);
      expect(result.sundayHours).toBe(0);
      expect(result.holidayHours).toBe(0);

      console.log('✅ Heures normales OK');
    });

    test('Heures: 45h (5h sup) → Avertit', () => {
      const result = PayrollValidators.validateWorkingHours(45, 0, 0);

      expect(result.regularHours).toBe(40);

      console.log('✅ Heures sup détectées');
    });

    test('Heures: Négatives → Rejeté', () => {
      expect(() => {
        PayrollValidators.validateWorkingHours(-5, 0, 0);
      }).toThrow(BadRequestException);

      console.log('✅ Heures négatives rejetées');
    });

    test('Heures: Dimanche + Férié → Valide', () => {
      const result = PayrollValidators.validateWorkingHours(40, 8, 4);

      expect(result.regularHours).toBe(40);
      expect(result.sundayHours).toBe(8);
      expect(result.holidayHours).toBe(4);

      console.log('✅ Heures spéciales OK');
    });
  });

  describe('Validation Avances', () => {
    test('Avance: 30% salaire → Accepté', () => {
      const grossSalary = 1_000_000;
      const advance = 300_000;

      expect(() => {
        PayrollValidators.validateAdvanceDeduction(advance, grossSalary);
      }).not.toThrow();

      console.log('✅ Avance raisonnable OK');
    });

    test('Avance: 50% salaire (limite) → Accepté', () => {
      const grossSalary = 1_000_000;
      const advance = 500_000;

      expect(() => {
        PayrollValidators.validateAdvanceDeduction(advance, grossSalary);
      }).not.toThrow();

      console.log('✅ Avance limite OK');
    });

    test('Avance: 60% salaire → Rejeté', () => {
      const grossSalary = 1_000_000;
      const advance = 600_000;

      expect(() => {
        PayrollValidators.validateAdvanceDeduction(advance, grossSalary);
      }).toThrow(BadRequestException);

      console.log('✅ Avance excessive rejetée');
    });
  });

  describe('Validation Cotisations Retraite', () => {
    test('Retraite: 10% salaire → Accepté', () => {
      const grossSalary = 1_000_000;
      const contribution = 100_000;

      expect(() => {
        PayrollValidators.validateRetirementContribution(contribution, grossSalary);
      }).not.toThrow();

      console.log('✅ Cotisation retraite OK');
    });

    test('Retraite: 20% salaire → Rejeté', () => {
      const grossSalary = 1_000_000;
      const contribution = 200_000;

      expect(() => {
        PayrollValidators.validateRetirementContribution(contribution, grossSalary);
      }).toThrow(BadRequestException);

      console.log('✅ Cotisation excessive rejetée');
    });
  });

  describe('Validation Période', () => {
    test('Période: 2026-08 → Accepté', () => {
      expect(PayrollValidators.validatePayrollPeriod('2026-08')).toBe(true);
      expect(PayrollValidators.validatePayrollPeriod('2025-01')).toBe(true);
      expect(PayrollValidators.validatePayrollPeriod('2024-12')).toBe(true);

      console.log('✅ Périodes valides OK');
    });

    test('Période: Format invalide → Rejeté', () => {
      expect(() => {
        PayrollValidators.validatePayrollPeriod('2026/08');
      }).toThrow(BadRequestException);

      expect(() => {
        PayrollValidators.validatePayrollPeriod('08-2026');
      }).toThrow(BadRequestException);

      expect(() => {
        PayrollValidators.validatePayrollPeriod('2026-13');
      }).toThrow(BadRequestException);

      console.log('✅ Périodes invalides rejetées');
    });
  });

  describe('Validation Statut', () => {
    test('Statut: ACTIVE → Accepté', () => {
      expect(PayrollValidators.validateEmployeeStatus('ACTIVE')).toBe(true);

      console.log('✅ Statut ACTIVE OK');
    });

    test('Statut: Non-ACTIVE → Rejeté', () => {
      expect(() => {
        PayrollValidators.validateEmployeeStatus('RESIGNED');
      }).toThrow(BadRequestException);

      expect(() => {
        PayrollValidators.validateEmployeeStatus('ON_LEAVE');
      }).toThrow(BadRequestException);

      console.log('✅ Statuts invalides rejetés');
    });
  });

  describe('Validation Groupe Risque', () => {
    test('Risque: A, B, C → Valides', () => {
      expect(PayrollValidators.validateRiskGroup('A')).toBe('A');
      expect(PayrollValidators.validateRiskGroup('B')).toBe('B');
      expect(PayrollValidators.validateRiskGroup('C')).toBe('C');

      console.log('✅ Groupes risque OK');
    });

    test('Risque: Undefined → Default A', () => {
      expect(PayrollValidators.validateRiskGroup(undefined)).toBe('A');

      console.log('✅ Default risque OK');
    });
  });

  describe('Validation Montants', () => {
    test('Montants: Tous positifs → Accepté', () => {
      const data = {
        grossSalary: 1_000_000,
        cnpsEmployee: 42_000,
        irpp: 150_000,
      };

      expect(() => {
        PayrollValidators.validateNoNegativeAmounts(data);
      }).not.toThrow();

      console.log('✅ Montants positifs OK');
    });

    test('Montants: Un négatif → Rejeté', () => {
      const data = {
        grossSalary: 1_000_000,
        cnpsEmployee: -42_000,
        irpp: 150_000,
      };

      expect(() => {
        PayrollValidators.validateNoNegativeAmounts(data);
      }).toThrow(BadRequestException);

      console.log('✅ Montants négatifs rejetés');
    });
  });

  describe('Validation Cohérence Brut/Net', () => {
    test('Cohérence: Net < Brut → Accepté', () => {
      expect(() => {
        PayrollValidators.validateNetSalaryCoherence(1_000_000, 700_000);
      }).not.toThrow();

      console.log('✅ Cohérence OK');
    });

    test('Cohérence: Net > Brut → Rejeté', () => {
      expect(() => {
        PayrollValidators.validateNetSalaryCoherence(1_000_000, 1_100_000);
      }).toThrow(BadRequestException);

      console.log('✅ Incohérence détectée');
    });

    test('Cohérence: Net négatif → Rejeté', () => {
      expect(() => {
        PayrollValidators.validateNetSalaryCoherence(1_000_000, -100_000);
      }).toThrow(BadRequestException);

      console.log('✅ Net négatif rejeté');
    });
  });

  describe('CNPS Cap', () => {
    test('CNPS Cap: Salaire > 750k → Capped', () => {
      const result = PayrollValidators.validateCNPSCap(1_000_000);

      expect(result).toBe(750_000);

      console.log('✅ CNPS Cap OK');
    });

    test('CNPS Cap: Salaire < 750k → Pas de cap', () => {
      const result = PayrollValidators.validateCNPSCap(500_000);

      expect(result).toBe(500_000);

      console.log('✅ Pas de cap OK');
    });
  });
});
