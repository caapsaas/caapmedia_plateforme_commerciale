import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { PayrollRecord, PayrollCumulative, Prisma } from '@prisma/client';
import { generateId } from '../../common/utils/generate-id.util';
import { ID_PREFIXES } from '../../common/constants/id-prefixes.const';

/**
 * Service de gestion des cumuls de paie
 *
 * Responsabilités :
 * - Tracker les cumuls annuels (CNPS, IRPP, etc.)
 * - Supporter les calculs progressifs de retenues
 * - Audit trail pour les cumuls
 */
@Injectable()
export class PayrollCumulativeService {
  private readonly logger = new Logger(PayrollCumulativeService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Mettre à jour les cumuls après une génération de paie.
   * À appeler dans une transaction atomique avec la création du PayrollRecord.
   */
  async updateCumulatives(
    tx: Prisma.TransactionClient,
    payrollRecord: PayrollRecord,
  ): Promise<PayrollCumulative> {
    const year = payrollRecord.payrollPeriod.substring(0, 4);
    const month = payrollRecord.payrollPeriod;

    this.logger.log(
      `📊 Mise à jour cumuls: Employé ${payrollRecord.employeeId} - ${month}`,
    );

    // Récupérer le cumul annuel précédent (ou créer un nouveau)
    const currentCumulative = await tx.payrollCumulative.findUnique({
      where: {
        employeeId_year_month: {
          employeeId: payrollRecord.employeeId,
          year,
          month: null, // cumul annuel sans mois spécifique
        },
      },
    });

    const previousGross = currentCumulative?.grossCumululative || 0;
    const previousCNPS = currentCumulative?.cnpsCumulative || 0;
    const previousIRPP = currentCumulative?.irppCumulative || 0;

    const newGross = Number(previousGross) + Number(payrollRecord.grossSalary);
    const newCNPS = Number(previousCNPS) + Number(payrollRecord.cnpsEmployee);
    const newIRPP = Number(previousIRPP) + Number(payrollRecord.irpp);
    const newCFC = Number(currentCumulative?.cfcCumulative || 0) + Number(payrollRecord.cfcEmployee);
    const newCAC = Number(currentCumulative?.cacCumulative || 0) + Number(payrollRecord.cac);

    const newDeductions =
      Number(currentCumulative?.deductionsCumululative || 0) +
      Number(payrollRecord.deductions);
    const newNet =
      Number(currentCumulative?.netCumululative || 0) + Number(payrollRecord.netSalary);

    this.logger.log(
      `💰 Cumuls annuels: Brut=${newGross}, CNPS=${newCNPS}, IRPP=${newIRPP}`,
    );

    // Upsert le cumul
    const cumulative = await tx.payrollCumulative.upsert({
      where: {
        employeeId_year_month: {
          employeeId: payrollRecord.employeeId,
          year,
          month: null,
        },
      },
      create: {
        id: generateId(ID_PREFIXES.PAYROLL_CUMULATIVE),
        employeeId: payrollRecord.employeeId,
        subsidiaryId: payrollRecord.subsidiaryId,
        year,
        month: null,
        grossCumululative: new Prisma.Decimal(newGross),
        deductionsCumululative: new Prisma.Decimal(newDeductions),
        netCumululative: new Prisma.Decimal(newNet),
        cnpsCumulative: new Prisma.Decimal(newCNPS),
        cfcCumulative: new Prisma.Decimal(newCFC),
        irppCumulative: new Prisma.Decimal(newIRPP),
        cacCumulative: new Prisma.Decimal(newCAC),
        lastPayrollId: payrollRecord.id,
      },
      update: {
        grossCumululative: new Prisma.Decimal(newGross),
        deductionsCumululative: new Prisma.Decimal(newDeductions),
        netCumululative: new Prisma.Decimal(newNet),
        cnpsCumulative: new Prisma.Decimal(newCNPS),
        cfcCumulative: new Prisma.Decimal(newCFC),
        irppCumulative: new Prisma.Decimal(newIRPP),
        cacCumulative: new Prisma.Decimal(newCAC),
        lastPayrollId: payrollRecord.id,
      },
    });

    this.logger.log(`✅ Cumuls mis à jour pour ${payrollRecord.employeeId}`);
    return cumulative;
  }

  /**
   * Créer les détails de déductions (audit trail)
   */
  async createDeductionDetails(
    tx: Prisma.TransactionClient,
    payrollRecordId: string,
    deductions: {
      cnpsEmployee: number;
      cfcEmployee: number;
      irpp: number;
      cac: number;
      otherDeductions: number;
    },
    grossSalary: number,
  ): Promise<void> {
    const details: Prisma.PayrollDeductionDetailCreateManyInput[] = [];

    // CNPS salarié
    if (deductions.cnpsEmployee > 0) {
      const rate = deductions.cnpsEmployee / grossSalary;
      details.push({
        id: generateId(ID_PREFIXES.PAYROLL_DEDUCTION_DETAIL),
        payrollRecordId,
        deductionType: 'CNPS',
        description: 'CNPS salarié 4.2% (plafonné)',
        baseAmount: new Prisma.Decimal(grossSalary),
        rateApplied: new Prisma.Decimal(rate),
        amount: new Prisma.Decimal(deductions.cnpsEmployee),
      });
    }

    // CFC salarié
    if (deductions.cfcEmployee > 0) {
      const rate = deductions.cfcEmployee / grossSalary;
      details.push({
        id: generateId(ID_PREFIXES.PAYROLL_DEDUCTION_DETAIL),
        payrollRecordId,
        deductionType: 'CFC',
        description: 'CFC salarié 1%',
        baseAmount: new Prisma.Decimal(grossSalary),
        rateApplied: new Prisma.Decimal(rate),
        amount: new Prisma.Decimal(deductions.cfcEmployee),
      });
    }

    // IRPP
    if (deductions.irpp > 0) {
      const rate = deductions.irpp / grossSalary;
      details.push({
        id: generateId(ID_PREFIXES.PAYROLL_DEDUCTION_DETAIL),
        payrollRecordId,
        deductionType: 'IRPP',
        description: 'Impôt sur le revenu progressif',
        baseAmount: new Prisma.Decimal(grossSalary),
        rateApplied: new Prisma.Decimal(rate),
        amount: new Prisma.Decimal(deductions.irpp),
      });
    }

    // CAC (contribution additionnelle)
    if (deductions.cac > 0) {
      const rate = deductions.cac / deductions.irpp;
      details.push({
        id: generateId(ID_PREFIXES.PAYROLL_DEDUCTION_DETAIL),
        payrollRecordId,
        deductionType: 'CAC',
        description: 'CAC 10% de l\'IRPP',
        baseAmount: new Prisma.Decimal(deductions.irpp),
        rateApplied: new Prisma.Decimal(rate),
        amount: new Prisma.Decimal(deductions.cac),
      });
    }

    // Autres retenues
    if (deductions.otherDeductions > 0) {
      details.push({
        id: generateId(ID_PREFIXES.PAYROLL_DEDUCTION_DETAIL),
        payrollRecordId,
        deductionType: 'OTHER',
        description: 'Autres retenues (avances, prêts, absences)',
        baseAmount: new Prisma.Decimal(deductions.otherDeductions),
        rateApplied: new Prisma.Decimal(1),
        amount: new Prisma.Decimal(deductions.otherDeductions),
      });
    }

    if (details.length > 0) {
      await tx.payrollDeductionDetail.createMany({
        data: details,
      });

      this.logger.log(`✅ ${details.length} détails de déduction créés`);
    }
  }

  /**
   * Récupérer le cumul annuel d'un employé
   */
  async getAnnualCumulative(
    employeeId: string,
    year: string,
  ): Promise<PayrollCumulative | null> {
    return this.prisma.payrollCumulative.findUnique({
      where: {
        employeeId_year_month: {
          employeeId,
          year,
          month: null,
        },
      },
    });
  }

  /**
   * Récupérer le détail des déductions d'une fiche de paie
   */
  async getDeductionDetails(payrollRecordId: string) {
    return this.prisma.payrollDeductionDetail.findMany({
      where: { payrollRecordId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
