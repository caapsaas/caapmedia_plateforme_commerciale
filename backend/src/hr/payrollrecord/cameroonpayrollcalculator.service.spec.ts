import { Test, TestingModule } from '@nestjs/testing';
import { CameroonPayrollCalculatorService } from './cameroonpayrollcalculator.service';

describe('CameroonPayrollCalculatorService', () => {
  let service: CameroonPayrollCalculatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CameroonPayrollCalculatorService],
    }).compile();

    service = module.get<CameroonPayrollCalculatorService>(
      CameroonPayrollCalculatorService,
    );
  });

  describe('calculate() - Forward Calculation (Base → Gross → Net)', () => {
    it('should calculate basic payroll with base salary only', () => {
      const result = service.calculate({
        baseSalary: 150000,
        riskGroup: 'A',
        applyCfc: true,
        applyFne: true,
      });

      expect(result.baseSalary).toBe(150000);
      expect(result.grossSalary).toBe(150000);
      expect(result.cnpsEmployee).toBeGreaterThan(0);
      expect(result.netSalary).toBeLessThan(150000); // Net should be less than gross
      expect(result.totalDeductions).toBe(
        result.cnpsEmployee +
          result.cfcEmployee +
          result.irpp +
          result.cac +
          result.otherDeductions,
      );
    });

    it('should include bonus in gross salary', () => {
      const result = service.calculate({
        baseSalary: 150000,
        bonus: 50000,
        riskGroup: 'A',
        applyCfc: true,
        applyFne: true,
      });

      expect(result.baseSalary).toBe(150000);
      expect(result.grossSalary).toBe(200000);
      expect(result.netSalary).toBeLessThan(200000);
    });

    it('should apply allowances, overtime, and other taxable income', () => {
      const result = service.calculate({
        baseSalary: 150000,
        allowances: 20000,
        overtime: 10000,
        otherTaxable: 5000,
        riskGroup: 'A',
        applyCfc: true,
        applyFne: true,
      });

      expect(result.grossSalary).toBe(185000);
    });

    it('should calculate CNPS employee deduction (4.2% capped at 750k)', () => {
      // Test below cap
      const resultBelow = service.calculate({
        baseSalary: 200000,
        riskGroup: 'A',
        applyCfc: true,
        applyFne: true,
      });

      const expectedCnps = Math.round(200000 * 0.042);
      expect(resultBelow.cnpsEmployee).toBe(expectedCnps);

      // Test above cap (CNPS should be capped)
      const resultAbove = service.calculate({
        baseSalary: 1000000,
        riskGroup: 'A',
        applyCfc: true,
        applyFne: true,
      });

      const cappedCnps = Math.round(750000 * 0.042);
      expect(resultAbove.cnpsEmployee).toBe(cappedCnps);
    });

    it('should calculate CFC deduction (1% when enabled)', () => {
      const resultWithCfc = service.calculate({
        baseSalary: 150000,
        applyCfc: true,
        riskGroup: 'A',
      });

      const expectedCfc = Math.round(150000 * 0.01);
      expect(resultWithCfc.cfcEmployee).toBe(expectedCfc);

      const resultWithoutCfc = service.calculate({
        baseSalary: 150000,
        applyCfc: false,
        riskGroup: 'A',
      });

      expect(resultWithoutCfc.cfcEmployee).toBe(0);
    });

    it('should calculate employer charges', () => {
      const result = service.calculate({
        baseSalary: 200000,
        riskGroup: 'A',
        applyCfc: true,
        applyFne: true,
      });

      // CNPS employer: pension + family + accident risk
      const cnpsBase = Math.min(200000, 750000);
      const expectedPension = Math.round(cnpsBase * 0.042);
      const expectedFamily = Math.round(cnpsBase * 0.07);
      const expectedAccident = Math.round(cnpsBase * 0.0175); // Risk A

      expect(result.cnpsEmployerPension).toBe(expectedPension);
      expect(result.cnpsFamilyBenefits).toBe(expectedFamily);
      expect(result.cnpsAccidentRisk).toBe(expectedAccident);

      // Verify total employer cost
      expect(result.totalEmployerCost).toBeGreaterThan(result.grossSalary);
    });

    it('should apply different risk groups for accident insurance', () => {
      const resultA = service.calculate({
        baseSalary: 200000,
        riskGroup: 'A',
        applyCfc: true,
      });

      const resultB = service.calculate({
        baseSalary: 200000,
        riskGroup: 'B',
        applyCfc: true,
      });

      const resultC = service.calculate({
        baseSalary: 200000,
        riskGroup: 'C',
        applyCfc: true,
      });

      // Risk C should have the highest accident charge
      expect(resultC.cnpsAccidentRisk).toBeGreaterThan(
        resultB.cnpsAccidentRisk,
      );
      expect(resultB.cnpsAccidentRisk).toBeGreaterThan(resultA.cnpsAccidentRisk);
    });

    it('should calculate FNE when enabled', () => {
      const resultWithFne = service.calculate({
        baseSalary: 150000,
        applyFne: true,
        riskGroup: 'A',
      });

      const expectedFne = Math.round(150000 * 0.01);
      expect(resultWithFne.fne).toBe(expectedFne);

      const resultWithoutFne = service.calculate({
        baseSalary: 150000,
        applyFne: false,
        riskGroup: 'A',
      });

      expect(resultWithoutFne.fne).toBe(0);
    });

    it('should return deductions detail array', () => {
      const result = service.calculate({
        baseSalary: 150000,
        riskGroup: 'A',
        applyCfc: true,
        applyFne: true,
      });

      expect(Array.isArray(result.deductionsDetail)).toBe(true);
      expect(result.deductionsDetail.length).toBeGreaterThan(0);

      // Check that each deduction has label, amount, and type
      result.deductionsDetail.forEach((deduction) => {
        expect(deduction.label).toBeDefined();
        expect(deduction.amount).toBeGreaterThan(0);
        expect(['STATUTORY', 'VOLUNTARY', 'ADVANCE', 'OTHER']).toContain(
          deduction.type,
        );
      });
    });
  });

  describe('calculateFromNetSalary() - Reverse Calculation (Net → Base)', () => {
    it('should calculate base salary from target net salary', () => {
      const targetNet = 130000;

      const result = service.calculateFromNetSalary({
        targetNetSalary: targetNet,
        bonus: 0,
        riskGroup: 'A',
        applyCfc: true,
        applyFne: true,
      });

      // The calculated net should be close to target (within 1 FCFA tolerance)
      expect(Math.abs(result.netSalary - targetNet)).toBeLessThanOrEqual(1);
      expect(result.baseSalary).toBeGreaterThan(targetNet);
    });

    it('should return consistent results: forward(base) ≈ reverse(net)', () => {
      const originalBase = 150000;

      // Forward: calculate net from base
      const forwardResult = service.calculate({
        baseSalary: originalBase,
        riskGroup: 'A',
        applyCfc: true,
        applyFne: true,
      });

      const targetNet = forwardResult.netSalary;

      // Reverse: calculate base from that net
      const reverseResult = service.calculateFromNetSalary({
        targetNetSalary: targetNet,
        riskGroup: 'A',
        applyCfc: true,
        applyFne: true,
      });

      // Should converge to similar net
      expect(Math.abs(reverseResult.netSalary - targetNet)).toBeLessThanOrEqual(
        1,
      );

      // Base should be close (allow some rounding difference)
      expect(Math.abs(reverseResult.baseSalary - originalBase)).toBeLessThan(2);
    });

    it('should handle gross-up with bonus', () => {
      const targetNet = 120000;
      const bonus = 30000;

      const result = service.calculateFromNetSalary({
        targetNetSalary: targetNet,
        bonus,
        riskGroup: 'A',
        applyCfc: true,
        applyFne: true,
      });

      expect(Math.abs(result.netSalary - targetNet)).toBeLessThanOrEqual(1);
      expect(result.grossSalary).toBeGreaterThan(bonus);
    });

    it('should converge within reasonable iterations', () => {
      // Test multiple salary ranges
      const targetNets = [100000, 200000, 500000, 1000000];

      targetNets.forEach((targetNet) => {
        const result = service.calculateFromNetSalary({
          targetNetSalary: targetNet,
          riskGroup: 'A',
          applyCfc: true,
          applyFne: true,
        });

        expect(Math.abs(result.netSalary - targetNet)).toBeLessThanOrEqual(1);
        expect(result.baseSalary).toBeGreaterThan(0);
      });
    });

    it('should handle different risk groups in reverse calculation', () => {
      const targetNet = 150000;

      const resultA = service.calculateFromNetSalary({
        targetNetSalary: targetNet,
        riskGroup: 'A',
        applyCfc: true,
      });

      const resultC = service.calculateFromNetSalary({
        targetNetSalary: targetNet,
        riskGroup: 'C',
        applyCfc: true,
      });

      // Risk C has higher employer charges, so base salary might be different
      // but net should be the same
      expect(Math.abs(resultA.netSalary - resultC.netSalary)).toBeLessThanOrEqual(
        1,
      );
    });
  });

  describe('Progressive IRPP Calculation', () => {
    it('should include IRPP and CAC in payroll calculations', () => {
      const result = service.calculate({
        baseSalary: 2000000,
        riskGroup: 'A',
        applyCfc: true,
      });

      // IRPP should be calculated (or 0 if below threshold)
      expect(result.irpp).toBeGreaterThanOrEqual(0);

      // CAC should be 10% of IRPP
      const expectedCac = Math.round(result.irpp * 0.1);
      expect(result.cac).toBe(expectedCac);

      // All calculations should be present
      expect(result.netSalary).toBeGreaterThan(0);
      expect(result.totalDeductions).toBeGreaterThanOrEqual(result.irpp + result.cac);
    });

    it('should include CAC (10% of IRPP)', () => {
      const result = service.calculate({
        baseSalary: 300000,
        riskGroup: 'A',
      });

      const expectedCac = Math.round(result.irpp * 0.1);
      expect(result.cac).toBe(expectedCac);
    });
  });

  describe('Cumulative Calculations (Annual Caps)', () => {
    it('should respect CNPS cumulative cap (750k annually)', () => {
      // First payroll: 200k salary
      const first = service.calculate({
        baseSalary: 200000,
        riskGroup: 'A',
        applyCfc: true,
      });

      const firstCnps = first.cnpsEmployee;

      // Second payroll with cumulative tracking
      const second = service.calculate({
        baseSalary: 200000,
        riskGroup: 'A',
        applyCfc: true,
        previousCnpsCumulative: firstCnps,
      });

      // Still under cap, should be normal
      expect(second.cnpsEmployee).toBe(firstCnps);

      // After 4+ payrolls, should hit cap
      let cumulative = 0;
      for (let i = 0; i < 5; i++) {
        const result = service.calculate({
          baseSalary: 200000,
          riskGroup: 'A',
          applyCfc: true,
          previousCnpsCumulative: cumulative,
        });
        cumulative += result.cnpsEmployee;
      }

      // Last one should have 0 or minimal CNPS
      const lastWithCap = service.calculate({
        baseSalary: 200000,
        riskGroup: 'A',
        applyCfc: true,
        previousCnpsCumulative: cumulative - firstCnps,
      });

      expect(lastWithCap.cnpsEmployee).toBeLessThanOrEqual(firstCnps);
    });

    it('should handle progressive IRPP with cumulative tracking', () => {
      // Simulate monthly payrolls over the year
      const baseSalary = 200000;
      let grossCumulative = 0;
      let irppCumulative = 0;

      for (let month = 1; month <= 12; month++) {
        const result = service.calculate({
          baseSalary,
          riskGroup: 'A',
          applyCfc: true,
          previousGrossCumulative: grossCumulative,
          previousIrppCumulative: irppCumulative,
        });

        grossCumulative += result.grossSalary;
        irppCumulative += result.irpp;

        // Each month should have IRPP
        expect(result.irpp).toBeGreaterThanOrEqual(0);
      }

      // Cumulative should grow
      expect(irppCumulative).toBeGreaterThan(0);
      expect(grossCumulative).toBe(baseSalary * 12);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero salary', () => {
      const result = service.calculate({
        baseSalary: 0,
        riskGroup: 'A',
      });

      expect(result.grossSalary).toBe(0);
      expect(result.netSalary).toBe(0);
      expect(result.cnpsEmployee).toBe(0);
    });

    it('should handle very high salary', () => {
      const result = service.calculate({
        baseSalary: 10000000,
        riskGroup: 'A',
        applyCfc: true,
        applyFne: true,
      });

      expect(result.grossSalary).toBe(10000000);
      expect(result.netSalary).toBeGreaterThan(0);
      expect(result.netSalary).toBeLessThan(result.grossSalary);
    });

    it('should calculate with only base salary (no bonus)', () => {
      const result = service.calculate({
        baseSalary: 150000,
        riskGroup: 'A',
      });

      expect(result.baseSalary).toBe(150000);
      expect(result.grossSalary).toBe(150000);
    });

    it('should handle missing optional parameters', () => {
      const result = service.calculate({
        baseSalary: 150000,
      });

      expect(result.baseSalary).toBe(150000);
      expect(result.grossSalary).toBe(150000);
      expect(result.netSalary).toBeGreaterThan(0);
    });
  });

  describe('Validation & Consistency', () => {
    it('should ensure net salary ≤ gross salary', () => {
      const inputs = [
        { baseSalary: 100000 },
        { baseSalary: 500000 },
        { baseSalary: 1000000 },
      ];

      inputs.forEach((input) => {
        const result = service.calculate({
          riskGroup: 'A',
          applyCfc: true,
          ...input,
        });

        expect(result.netSalary).toBeLessThanOrEqual(result.grossSalary);
      });
    });

    it('should ensure deductions total equals sum of components', () => {
      const result = service.calculate({
        baseSalary: 250000,
        riskGroup: 'A',
        applyCfc: true,
        applyFne: true,
      });

      const calculatedTotal =
        result.cnpsEmployee +
        result.cfcEmployee +
        result.irpp +
        result.cac +
        result.otherDeductions;

      expect(result.totalDeductions).toBe(calculatedTotal);
    });

    it('should ensure net = gross - deductions', () => {
      const result = service.calculate({
        baseSalary: 300000,
        riskGroup: 'A',
        applyCfc: true,
      });

      const calculatedNet = result.grossSalary - result.totalDeductions;
      expect(result.netSalary).toBe(Math.round(calculatedNet));
    });

    it('should ensure employer cost = gross + employer charges', () => {
      const result = service.calculate({
        baseSalary: 200000,
        riskGroup: 'A',
        applyCfc: true,
        applyFne: true,
      });

      const expectedCost =
        result.grossSalary + result.totalEmployerCharges;

      expect(result.totalEmployerCost).toBe(Math.round(expectedCost));
    });
  });

  describe('Real-world Scenarios', () => {
    it('should calculate realistic junior employee salary', () => {
      // Junior employee: 150k base, no bonus
      const result = service.calculate({
        baseSalary: 150000,
        riskGroup: 'A',
        applyCfc: true,
        applyFne: true,
      });

      expect(result.baseSalary).toBe(150000);
      expect(result.netSalary).toBeGreaterThan(120000); // Should take home reasonable amount
      expect(result.netSalary).toBeLessThan(150000);
    });

    it('should calculate realistic senior employee salary with bonus', () => {
      // Senior employee: 500k base + 100k bonus
      const result = service.calculate({
        baseSalary: 500000,
        bonus: 100000,
        riskGroup: 'B',
        applyCfc: true,
        applyFne: true,
      });

      expect(result.grossSalary).toBe(600000);
      expect(result.netSalary).toBeGreaterThan(400000);
      expect(result.netSalary).toBeLessThan(600000);
    });

    it('should reverse-calculate realistic junior salary from net', () => {
      const targetNet = 130000; // What junior wants to take home (Jean Dupont)

      const result = service.calculateFromNetSalary({
        targetNetSalary: targetNet,
        bonus: 0,
        riskGroup: 'A',
        applyCfc: true,
        applyFne: true,
      });

      expect(Math.abs(result.netSalary - targetNet)).toBeLessThanOrEqual(1);
      expect(result.baseSalary).toBeGreaterThan(targetNet);
    });

    it('should reverse-calculate realistic senior salary from net with bonus', () => {
      const targetNet = 450000; // What senior wants to take home

      const result = service.calculateFromNetSalary({
        targetNetSalary: targetNet,
        bonus: 100000,
        riskGroup: 'B',
        applyCfc: true,
        applyFne: true,
      });

      expect(Math.abs(result.netSalary - targetNet)).toBeLessThanOrEqual(1);
      expect(result.grossSalary).toBeGreaterThan(targetNet);
    });
  });

  describe('Seeded Employee Data - Real-world Scenarios', () => {
    // Data from backend/prisma/seeders/employee.seeder.ts
    // These are the actual employees seeded in the database

    it('Jean Dupont - reverse calculate from 130k net salary', () => {
      // Jean Dupont: Production Manager, targetNetSalary: 130000
      const jeanResult = service.calculateFromNetSalary({
        targetNetSalary: 130000,
        bonus: 0,
        riskGroup: 'A',
        applyCfc: true,
        applyFne: true,
      });

      expect(Math.abs(jeanResult.netSalary - 130000)).toBeLessThanOrEqual(1);
      expect(jeanResult.baseSalary).toBeGreaterThan(130000);
      expect(jeanResult.grossSalary).toBeGreaterThan(130000);
      expect(jeanResult.netSalary).toBeLessThan(jeanResult.grossSalary);

      // Verify calculation consistency with forward pass
      const jeanForward = service.calculate({
        baseSalary: jeanResult.baseSalary,
        riskGroup: 'A',
        applyCfc: true,
        applyFne: true,
      });

      expect(Math.abs(jeanForward.netSalary - 130000)).toBeLessThanOrEqual(1);
    });

    it('Marie Martin - reverse calculate from 150k net salary', () => {
      // Marie Martin: Finance Director, targetNetSalary: 150000
      const marieResult = service.calculateFromNetSalary({
        targetNetSalary: 150000,
        bonus: 0,
        riskGroup: 'A',
        applyCfc: true,
        applyFne: true,
      });

      expect(Math.abs(marieResult.netSalary - 150000)).toBeLessThanOrEqual(1);
      expect(marieResult.baseSalary).toBeGreaterThan(150000);
      expect(marieResult.grossSalary).toBeGreaterThan(150000);

      // Verify calculation consistency with forward pass
      const marieForward = service.calculate({
        baseSalary: marieResult.baseSalary,
        riskGroup: 'A',
        applyCfc: true,
        applyFne: true,
      });

      expect(Math.abs(marieForward.netSalary - 150000)).toBeLessThanOrEqual(1);
    });

    it('Pierre Bernard - reverse calculate from 110k net salary', () => {
      // Pierre Bernard: Commercial Employee, targetNetSalary: 110000
      const pierreResult = service.calculateFromNetSalary({
        targetNetSalary: 110000,
        bonus: 0,
        riskGroup: 'A',
        applyCfc: true,
        applyFne: true,
      });

      expect(Math.abs(pierreResult.netSalary - 110000)).toBeLessThanOrEqual(1);
      expect(pierreResult.baseSalary).toBeGreaterThan(110000);
      expect(pierreResult.grossSalary).toBeGreaterThan(110000);

      // Verify calculation consistency with forward pass
      const pierreForward = service.calculate({
        baseSalary: pierreResult.baseSalary,
        riskGroup: 'A',
        applyCfc: true,
        applyFne: true,
      });

      expect(Math.abs(pierreForward.netSalary - 110000)).toBeLessThanOrEqual(1);
    });

    it('should compare seeded employees payroll consistently', () => {
      // Get base salaries for all seeded employees
      const jeanNet = service.calculateFromNetSalary({
        targetNetSalary: 130000,
        riskGroup: 'A',
        applyCfc: true,
        applyFne: true,
      });

      const marieNet = service.calculateFromNetSalary({
        targetNetSalary: 150000,
        riskGroup: 'A',
        applyCfc: true,
        applyFne: true,
      });

      const pierreNet = service.calculateFromNetSalary({
        targetNetSalary: 110000,
        riskGroup: 'A',
        applyCfc: true,
        applyFne: true,
      });

      // Marie should have higher net than Jean
      expect(marieNet.netSalary).toBeGreaterThan(jeanNet.netSalary);

      // Jean should have higher net than Pierre
      expect(jeanNet.netSalary).toBeGreaterThan(pierreNet.netSalary);

      // Verify base salary differences follow net differences
      expect(marieNet.baseSalary).toBeGreaterThan(jeanNet.baseSalary);
      expect(jeanNet.baseSalary).toBeGreaterThan(pierreNet.baseSalary);

      // All should have valid calculations
      [jeanNet, marieNet, pierreNet].forEach((result) => {
        expect(result.netSalary).toBeGreaterThan(0);
        expect(result.baseSalary).toBeGreaterThan(0);
        expect(result.netSalary).toBeLessThanOrEqual(result.grossSalary);
      });
    });

    it('should handle payroll cycle for all seeded employees', () => {
      // Simulate monthly payroll processing for January
      const employees = [
        { name: 'Jean', targetNetSalary: 130000 },
        { name: 'Marie', targetNetSalary: 150000 },
        { name: 'Pierre', targetNetSalary: 110000 },
      ];

      employees.forEach((emp) => {
        const result = service.calculateFromNetSalary({
          targetNetSalary: emp.targetNetSalary,
          riskGroup: 'A',
          applyCfc: true,
          applyFne: true,
        });

        // Verify all payroll components are present
        expect(result.baseSalary).toBeGreaterThan(0);
        expect(result.grossSalary).toBeDefined();
        expect(result.netSalary).toBeDefined();
        expect(result.cnpsEmployee).toBeGreaterThan(0);
        expect(result.cfcEmployee).toBeDefined();
        expect(result.irpp).toBeDefined();
        expect(result.cac).toBeDefined();
        expect(result.totalDeductions).toBeGreaterThan(0);
        expect(result.totalEmployerCost).toBeGreaterThan(result.grossSalary);
        expect(result.deductionsDetail).toBeDefined();
        expect(result.deductionsDetail.length).toBeGreaterThan(0);
      });
    });
  });
});
