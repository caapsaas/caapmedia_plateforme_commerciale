import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import {
  PayrollBonus,
  PayrollBonusStatus,
  Prisma,
  Employee,
  PayrollStatus,
  PayrollChargePayment,
  PayrollChargePaymentStatus,
} from '@prisma/client';
import { CameroonPayrollCalculatorService } from './cameroonpayrollcalculator.service';
import { AccountingOutboxService } from '../../accounting/outbox/accounting-outbox.service';
import { generateId } from '../../common/utils/generate-id.util';
import { ID_PREFIXES } from '../../common/constants/id-prefixes.const';

/**
 * Service unifié de gestion des bonus et charges patronales
 *
 * Fonctionnalités :
 * - Génération du 13e mois (obligatoire en Cameroun)
 * - Génération de primes diverses (performance, fin de contrat, etc.)
 * - Workflow d'approbation et de paiement des bonus
 * - Suivi des charges accumulées (CNPS, IRPP, CAC, CFC, FNE)
 * - Enregistrement des paiements de charges
 * - Écritures comptables automatiques (via JournalizationService)
 * - Audit trail complet
 */
@Injectable()
export class PayrollBonusAndChargeService {
  private readonly logger = new Logger(PayrollBonusAndChargeService.name);

  // === Comptes SYSCOHADA pour les dettes ===
  private readonly CNPS_PAYABLE_ACCOUNT = '424100';
  private readonly CFC_PAYABLE_ACCOUNT = '424200';
  private readonly IRPP_PAYABLE_ACCOUNT = '441000';
  private readonly CAC_PAYABLE_ACCOUNT = '441001';
  private readonly FNE_PAYABLE_ACCOUNT = '441002';
  private readonly BANK_ACCOUNT = '521000';

  constructor(
    private readonly prisma: PrismaService,
    private readonly calculator: CameroonPayrollCalculatorService,
    private readonly outbox: AccountingOutboxService,
  ) {}

  // ============================================================
  // BONUS
  // ============================================================

  /**
   * Génère le 13e mois pour un employé (obligatoire en Cameroun).
   */
  async generateThirteenthMonth(
    employeeId: string,
    month: string, // ex. '2024-12'
    year: string, // ex. '2024'
  ): Promise<PayrollBonus> {
    this.logger.log(
      `🎁 Génération 13e mois: Employé ${employeeId}, mois ${month}`,
    );

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { subsidiary: true },
    });

    if (!employee) {
      throw new NotFoundException(`Employé ${employeeId} introuvable`);
    }

    const payrolls = await this.prisma.payrollRecord.findMany({
      where: {
        employeeId,
        payrollPeriod: { startsWith: year },
        status: { in: [PayrollStatus.SIGNED, PayrollStatus.PAID] },
      },
      orderBy: { payrollPeriod: 'asc' },
    });

    if (!payrolls.length) {
      throw new BadRequestException(
        `Aucune fiche paie trouvée pour employé ${employeeId} en ${year}`,
      );
    }

    this.logger.log(
      `📊 ${payrolls.length} fiches paie trouvées pour calcul 13e mois`,
    );

    const totalGross = payrolls.reduce(
      (sum, p) => sum + Number(p.grossSalary),
      0,
    );
    const thirteenthGross = Math.round(totalGross / payrolls.length);

    this.logger.log(
      `💰 13e mois brut = ${totalGross} / ${payrolls.length} = ${thirteenthGross} FCFA`,
    );

    const result = this.calculator.calculate({
      baseSalary: thirteenthGross,
      riskGroup: employee.categoryCodeCNPS === 'C' ? 'C' : 'A',
      applyCfc: true,
      applyFne: true,
    });

    const existingBonus = await this.prisma.payrollBonus.findFirst({
      where: {
        employeeId,
        bonusTypeId: await this.getOrCreateBonusTypeId(
          employee.subsidiaryId,
          '13e_mois',
        ),
        period: month,
      },
    });

    if (existingBonus) {
      throw new ConflictException(
        `Un bonus 13e mois existe déjà pour ${employeeId} en ${month}`,
      );
    }

    const bonus = await this.prisma.payrollBonus.create({
      data: {
        id: generateId(ID_PREFIXES.PAYROLL_BONUS),
        employeeId,
        bonusTypeId: await this.getOrCreateBonusTypeId(
          employee.subsidiaryId,
          '13e_mois',
        ),
        grossAmount: new Prisma.Decimal(result.grossSalary),
        netAmount: new Prisma.Decimal(result.netSalary),
        cnpsDeduction: new Prisma.Decimal(result.cnpsEmployee),
        cfcDeduction: new Prisma.Decimal(result.cfcEmployee),
        irppDeduction: new Prisma.Decimal(result.irpp),
        cacDeduction: new Prisma.Decimal(result.cac),
        period: month,
        status: PayrollBonusStatus.PENDING,
        subsidiaryId: employee.subsidiaryId,
        notes: `Calculé sur moyenne ${payrolls.length} mois (total ${totalGross} FCFA)`,
      },
    });

    this.logger.log(
      `✅ 13e mois créé: ${bonus.id} - Brut ${result.grossSalary} FCFA, Net ${result.netSalary} FCFA`,
    );

    return bonus;
  }

  /**
   * Approuve un bonus pour le paiement (PENDING → APPROVED).
   */
  async approveBonus(
    bonusId: string,
    approvedBy: string,
  ): Promise<PayrollBonus> {
    this.logger.log(`✅ Approbation bonus: ${bonusId} par ${approvedBy}`);

    const bonus = await this.prisma.payrollBonus.findUnique({
      where: { id: bonusId },
    });

    if (!bonus) {
      throw new NotFoundException(`Bonus ${bonusId} introuvable`);
    }

    if (bonus.status !== PayrollBonusStatus.PENDING) {
      throw new ConflictException(
        `Bonus n'est pas en statut PENDING (actuellement: ${bonus.status})`,
      );
    }

    const updated = await this.prisma.payrollBonus.update({
      where: { id: bonusId },
      data: {
        status: PayrollBonusStatus.APPROVED,
        approvedBy,
        approvedAt: new Date(),
      },
    });

    this.logger.log(`✅ Bonus ${bonusId} approuvé`);
    return updated;
  }

  /**
   * Enregistre le paiement d'un bonus (APPROVED → PAID).
   * Enqueue l'intention comptable via Outbox Pattern.
   */
  async recordBonusPayment(
    bonusId: string,
    bankTransferId: string,
    paymentDate: Date = new Date(),
  ): Promise<PayrollBonus> {
    this.logger.log(`💳 Enregistrement paiement bonus: ${bonusId}`);

    const bonus = await this.prisma.payrollBonus.findUnique({
      where: { id: bonusId },
      include: { employee: true },
    });

    if (!bonus) {
      throw new NotFoundException(`Bonus ${bonusId} introuvable`);
    }

    if (bonus.status !== PayrollBonusStatus.APPROVED) {
      throw new ConflictException(
        `Bonus doit être en statut APPROVED avant paiement (actuellement: ${bonus.status})`,
      );
    }

    // Transaction atomique : paiement + outbox entry
    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Mettre à jour le statut du bonus
      const paid = await tx.payrollBonus.update({
        where: { id: bonusId },
        data: {
          status: PayrollBonusStatus.PAID,
          paymentDate,
          bankTransferId,
        },
      });

      // 2. Enqueue l'intention comptable (atomique avec le paiement)
      await this.outbox.enqueue(tx, {
        eventType: 'BONUS_ENTRY',
        subsidiaryId: bonus.subsidiaryId,
        payload: {
          userId: 'system',
          operationDate: paymentDate.toISOString(),
          amount: Number(bonus.grossAmount),
          description: `Paiement bonus - ${bonus.employee.firstName} ${bonus.employee.lastName}`,
          sourceId: bonusId,
        },
      });

      return paid;
    });

    this.logger.log(
      `✅ Paiement bonus ${bonusId} enregistré (Virement: ${bankTransferId}) + intention comptable enqueuée`,
    );
    return updated;
  }

  /**
   * Annule un bonus (PENDING ou APPROVED → CANCELLED).
   */
  async cancelBonus(bonusId: string, reason: string): Promise<PayrollBonus> {
    this.logger.warn(`❌ Annulation bonus: ${bonusId} - Raison: ${reason}`);

    const bonus = await this.prisma.payrollBonus.findUnique({
      where: { id: bonusId },
    });

    if (!bonus) {
      throw new NotFoundException(`Bonus ${bonusId} introuvable`);
    }

    if (bonus.status === PayrollBonusStatus.PAID) {
      throw new ConflictException(
        `Impossible d'annuler un bonus PAID. Créer une écriture de contre-passation au lieu.`,
      );
    }

    const updated = await this.prisma.payrollBonus.update({
      where: { id: bonusId },
      data: {
        status: PayrollBonusStatus.CANCELLED,
        notes: `${bonus.notes || ''}\n--- ANNULÉ: ${reason}`,
      },
    });

    this.logger.log(`✅ Bonus ${bonusId} annulé`);
    return updated;
  }

  /**
   * Extrait les bonus des fiches de paie et crée des PayrollBonus
   * Prend tous les montants bonus des PayrollRecords et les transforme en PayrollBonus séparés
   */
  async extractBonusesFromPayroll(
    subsidiaryId: string,
    month: string,
  ): Promise<{ created: number; skipped: number; total: number }> {
    this.logger.log(
      `🎁 Extraction des bonus des fiches de paie: ${month} pour filiale ${subsidiaryId}`,
    );

    const payrolls = await this.prisma.payrollRecord.findMany({
      where: {
        subsidiaryId,
        payrollPeriod: month,
        bonus: { gt: 0 },
        status: { in: [PayrollStatus.SIGNED, PayrollStatus.PAID] },
      },
      include: { employee: true },
    });

    if (!payrolls.length) {
      this.logger.log(`⚠️ Aucune fiche paie avec bonus pour ${month}`);
      return { created: 0, skipped: 0, total: 0 };
    }

    this.logger.log(
      `📊 ${payrolls.length} fiche(s) paie avec bonus trouvée(s)`,
    );

    let created = 0;
    let skipped = 0;

    for (const payroll of payrolls) {
      try {
        const bonusAmount = Number(payroll.bonus);
        const bonusTypeId = await this.getOrCreateBonusTypeId(
          subsidiaryId,
          'payroll_bonus',
        );

        const existing = await this.prisma.payrollBonus.findFirst({
          where: {
            employeeId: payroll.employeeId,
            bonusTypeId,
            period: month,
          },
        });

        if (existing) {
          this.logger.log(
            `⏭️ Bonus existant pour ${payroll.employee.firstName} ${payroll.employee.lastName} - skippé`,
          );
          skipped++;
          continue;
        }

        const result = this.calculator.calculate({
          baseSalary: bonusAmount,
          riskGroup: 'A',
          applyCfc: true,
          applyFne: true,
        });

        const bonus = await this.prisma.payrollBonus.create({
          data: {
            id: generateId(ID_PREFIXES.PAYROLL_BONUS),
            employeeId: payroll.employeeId,
            bonusTypeId,
            grossAmount: new Prisma.Decimal(bonusAmount),
            netAmount: new Prisma.Decimal(result.netSalary),
            cnpsDeduction: new Prisma.Decimal(result.cnpsEmployee),
            cfcDeduction: new Prisma.Decimal(result.cfcEmployee),
            irppDeduction: new Prisma.Decimal(result.irpp),
            cacDeduction: new Prisma.Decimal(result.cac),
            period: month,
            status: PayrollBonusStatus.PENDING,
            subsidiaryId,
            notes: `Extrait de fiche paie ${payroll.id}`,
          },
        });

        this.logger.log(
          `✅ Bonus créé pour ${payroll.employee.firstName} ${payroll.employee.lastName}: ${bonusAmount} FCFA`,
        );
        created++;
      } catch (error) {
        this.logger.error(
          `❌ Erreur lors de l'extraction bonus pour ${payroll.employeeId}: ${error.message}`,
        );
        skipped++;
      }
    }

    this.logger.log(
      `✅ Extraction terminée: ${created} bonus créé(s), ${skipped} skippé(s)`,
    );

    return {
      created,
      skipped,
      total: payrolls.length,
    };
  }

  /**
   * Liste les bonus en attente d'approbation.
   */
  async getPendingBonuses(subsidiaryId: string): Promise<
    (PayrollBonus & {
      employee: Employee;
      bonusType: { label: string; code: string };
    })[]
  > {
    return this.prisma.payrollBonus.findMany({
      where: {
        subsidiaryId,
        status: PayrollBonusStatus.PENDING,
      },
      include: {
        employee: true,
        bonusType: { select: { label: true, code: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Liste les bonus en attente de paiement.
   */
  async getApprovedBonuses(subsidiaryId: string): Promise<
    (PayrollBonus & {
      employee: Employee;
      bonusType: { label: string; code: string };
    })[]
  > {
    return this.prisma.payrollBonus.findMany({
      where: {
        subsidiaryId,
        status: PayrollBonusStatus.APPROVED,
      },
      include: {
        employee: true,
        bonusType: { select: { label: true, code: true } },
      },
      orderBy: { approvedAt: 'asc' },
    });
  }

  // ============================================================
  // CHARGES PATRONALES
  // ============================================================

  /**
   * Accumule les charges patronales, salariales et bonus par mois.
   * À appeler en fin de mois (batch mensuel ou cron job).
   * Retourne un résumé détaillé de toutes les charges accumulées.
   */
  async accumulateEmployerCharges(
    subsidiaryId: string | undefined,
    month: string,
  ): Promise<{
    month: string;
    totalPayrolls: number;
    employerCharges: Record<
      string,
      {
        amount: number;
        dueDate: string;
        status: string;
      }
    >;
    salaryDeductions: {
      byPaymentMethod: Record<
        string,
        {
          grossSalary: number;
          netSalary: number;
          cnps: number;
          cfc: number;
          irpp: number;
          cac: number;
          other: number;
          total: number;
        }
      >;
      grandTotal: number;
    };
    monthlyPrimes: {
      totalPrimes: number;
      averagePrimePerEmployee: number;
      employeesWithPrimes: number;
    };
    bonusCharges: {
      totalBonuses: number;
      deductionsTotal: {
        cnps: number;
        cfc: number;
        irpp: number;
        cac: number;
        other: number;
      };
      netBonusesTotal: number;
    };
    grandTotalAllCharges: number;
  }> {
    this.logger.log(`📊 Accumulation charges complètes: ${month}`);

    if (!subsidiaryId) {
      throw new BadRequestException(
        "SubsidiaryId manquant - impossible d'accumuler les charges",
      );
    }

    const payrolls = await this.prisma.payrollRecord.findMany({
      where: {
        subsidiaryId,
        payrollPeriod: month,
        status: { in: [PayrollStatus.SIGNED, PayrollStatus.PAID] },
      },
      include: {
        employee: { select: { paymentMethod: true } },
      },
    });

    if (!payrolls.length) {
      this.logger.warn(`⚠️ Aucune fiche paie pour ${month}`);
      return {
        month,
        totalPayrolls: 0,
        employerCharges: {},
        salaryDeductions: { byPaymentMethod: {}, grandTotal: 0 },
        monthlyPrimes: {
          totalPrimes: 0,
          averagePrimePerEmployee: 0,
          employeesWithPrimes: 0,
        },
        bonusCharges: {
          totalBonuses: 0,
          deductionsTotal: { cnps: 0, cfc: 0, irpp: 0, cac: 0, other: 0 },
          netBonusesTotal: 0,
        },
        grandTotalAllCharges: 0,
      };
    }

    // 1. CHARGES PATRONALES (CNPS, CFC, FNE)
    const employerChargesMap = {
      CNPS: payrolls.reduce((sum, p) => sum + Number(p.cnpsEmployer), 0),
      CFC: payrolls.reduce((sum, p) => sum + Number(p.cfcEmployer), 0),
      FNE: payrolls.reduce((sum, p) => sum + Number(p.fne), 0),
    };

    // 2. CHARGES SALARIALES (retenues) groupées par mode de paiement
    const salaryDeductionsByMethod: Record<
      string,
      {
        grossSalary: number;
        netSalary: number;
        cnps: number;
        cfc: number;
        irpp: number;
        cac: number;
        other: number;
        total: number;
      }
    > = {};

    for (const payroll of payrolls) {
      const method = payroll.employee?.paymentMethod || 'UNKNOWN';
      if (!salaryDeductionsByMethod[method]) {
        salaryDeductionsByMethod[method] = {
          grossSalary: 0,
          netSalary: 0,
          cnps: 0,
          cfc: 0,
          irpp: 0,
          cac: 0,
          other: 0,
          total: 0,
        };
      }

      salaryDeductionsByMethod[method].grossSalary += Number(
        payroll.grossSalary || 0,
      );
      salaryDeductionsByMethod[method].netSalary += Number(
        payroll.netSalary || 0,
      );
      salaryDeductionsByMethod[method].cnps += Number(
        payroll.cnpsEmployee || 0,
      );
      salaryDeductionsByMethod[method].cfc += Number(payroll.cfcEmployee || 0);
      salaryDeductionsByMethod[method].irpp += Number(payroll.irpp || 0);
      salaryDeductionsByMethod[method].cac += Number(payroll.cac || 0);
      salaryDeductionsByMethod[method].other += Number(
        payroll.otherDeductions || 0,
      );
      salaryDeductionsByMethod[method].total =
        salaryDeductionsByMethod[method].cnps +
        salaryDeductionsByMethod[method].cfc +
        salaryDeductionsByMethod[method].irpp +
        salaryDeductionsByMethod[method].cac +
        salaryDeductionsByMethod[method].other;
    }

    const totalSalaryDeductions = Object.values(
      salaryDeductionsByMethod,
    ).reduce(
      (sum, deductions) =>
        sum +
        deductions.cnps +
        deductions.cfc +
        deductions.irpp +
        deductions.cac +
        deductions.other,
      0,
    );

    // 3. PRIMES MENSUELLES (du PayrollRecord)
    const totalMonthlyPrimes = payrolls.reduce(
      (sum, p) => sum + Number(p.bonus || 0),
      0,
    );
    const employeesWithPrimes = payrolls.filter(
      (p) => Number(p.bonus || 0) > 0,
    ).length;
    const averagePrimePerEmployee =
      employeesWithPrimes > 0
        ? Math.round(totalMonthlyPrimes / employeesWithPrimes)
        : 0;

    const monthlyPrimesData = {
      totalPrimes: totalMonthlyPrimes,
      averagePrimePerEmployee,
      employeesWithPrimes,
    };

    // 4. CHARGES LIÉES AUX BONUS
    const approvedBonuses = await this.prisma.payrollBonus.findMany({
      where: {
        subsidiaryId,
        period: month,
        status: { in: [PayrollBonusStatus.APPROVED, PayrollBonusStatus.PAID] },
      },
    });

    const bonusChargesData = {
      totalBonuses: approvedBonuses.length,
      deductionsTotal: {
        cnps: 0,
        cfc: 0,
        irpp: 0,
        cac: 0,
        other: 0,
      },
      netBonusesTotal: 0,
    };

    for (const bonus of approvedBonuses) {
      bonusChargesData.deductionsTotal.cnps += Number(bonus.cnpsDeduction || 0);
      bonusChargesData.deductionsTotal.cfc += Number(bonus.cfcDeduction || 0);
      bonusChargesData.deductionsTotal.irpp += Number(bonus.irppDeduction || 0);
      bonusChargesData.deductionsTotal.cac += Number(bonus.cacDeduction || 0);
      bonusChargesData.deductionsTotal.other += Number(
        bonus.otherDeductions || 0,
      );
      bonusChargesData.netBonusesTotal += Number(bonus.netAmount || 0);
    }

    // 4. Persister les charges patronales et calculer le résumé
    this.logger.log(
      `📋 Totaux du mois ${month}: CNPS=${employerChargesMap.CNPS}, CFC=${employerChargesMap.CFC}, FNE=${employerChargesMap.FNE}`,
    );

    const result: {
      month: string;
      totalPayrolls: number;
      employerCharges: Record<
        string,
        {
          amount: number;
          dueDate: string;
          status: string;
        }
      >;
      salaryDeductions: {
        byPaymentMethod: Record<
          string,
          {
            grossSalary: number;
            netSalary: number;
            cnps: number;
            cfc: number;
            irpp: number;
            cac: number;
            other: number;
            total: number;
          }
        >;
        grandTotal: number;
      };
      monthlyPrimes: typeof monthlyPrimesData;
      bonusCharges: typeof bonusChargesData;
      grandTotalAllCharges: number;
    } = {
      month,
      totalPayrolls: payrolls.length,
      employerCharges: {},
      salaryDeductions: {
        byPaymentMethod: {},
        grandTotal: totalSalaryDeductions,
      },
      monthlyPrimes: monthlyPrimesData,
      bonusCharges: bonusChargesData,
      grandTotalAllCharges: 0,
    };

    // Persister les charges patronales
    let employerChargesTotal = 0;
    for (const [chargeType, amount] of Object.entries(employerChargesMap)) {
      if (amount > 0) {
        const dueDate = this.calculateDueDate(chargeType, month);

        try {
          const charge = await this.prisma.payrollChargePayment.upsert({
            where: {
              subsidiaryId_chargeType_month: {
                subsidiaryId,
                chargeType,
                month,
              },
            },
            create: {
              id: generateId(ID_PREFIXES.PAYROLL_CHARGE),
              subsidiaryId,
              chargeType,
              month,
              grossAmount: new Prisma.Decimal(amount),
              netAmount: new Prisma.Decimal(amount),
              status: PayrollChargePaymentStatus.ACCRUED,
              dueDate,
            },
            update: {
              grossAmount: new Prisma.Decimal(amount),
              netAmount: new Prisma.Decimal(amount),
            },
          });

          result.employerCharges[chargeType] = {
            amount,
            dueDate: dueDate.toISOString().split('T')[0],
            status: charge.status,
          };
          employerChargesTotal += amount;

          this.logger.log(
            `✅ ${chargeType} accumulée pour ${month}: ${amount} FCFA (due ${dueDate.toLocaleDateString('fr-FR')})`,
          );
        } catch (error) {
          this.logger.error(
            `❌ Erreur lors de l'accumulation ${chargeType}: ${error.message}`,
          );
          throw error;
        }
      }
    }

    // Formater les déductions salariales
    for (const [method, deductions] of Object.entries(
      salaryDeductionsByMethod,
    )) {
      const total =
        deductions.cnps +
        deductions.cfc +
        deductions.irpp +
        deductions.cac +
        deductions.other;
      result.salaryDeductions.byPaymentMethod[method] = {
        ...deductions,
        total,
      };
    }

    // Calculer le total général
    const bonusDeductionsTotal =
      bonusChargesData.deductionsTotal.cnps +
      bonusChargesData.deductionsTotal.cfc +
      bonusChargesData.deductionsTotal.irpp +
      bonusChargesData.deductionsTotal.cac +
      bonusChargesData.deductionsTotal.other;

    result.grandTotalAllCharges =
      employerChargesTotal + totalSalaryDeductions + bonusDeductionsTotal;

    this.logger.log(
      `✅ Accumulation complète: Charges patronales=${employerChargesTotal}, Déductions salariales=${totalSalaryDeductions}, Déductions bonus=${bonusDeductionsTotal}`,
    );

    return result;
  }

  /**
   * Enregistre le paiement d'une charge patronale.
   * Enqueue l'intention comptable via Outbox Pattern.
   */
  async recordChargePayment(
    chargePaymentId: string,
    bankTransferId: string,
    paidAmount: number,
    declarationNumber?: string,
  ): Promise<PayrollChargePayment> {
    this.logger.log(`💳 Enregistrement paiement charge: ${chargePaymentId}`);

    const charge = await this.prisma.payrollChargePayment.findUnique({
      where: { id: chargePaymentId },
      include: { subsidiary: true },
    });

    if (!charge) {
      throw new NotFoundException(`Charge ${chargePaymentId} introuvable`);
    }

    const grossAmount = Number(charge.grossAmount);
    const isPaid = paidAmount >= grossAmount;
    const isPartial = paidAmount > 0 && paidAmount < grossAmount;

    this.logger.log(
      `💰 ${charge.chargeType} ${charge.month}: ${paidAmount} FCFA payé`,
    );

    // Transaction atomique : paiement + outbox entry
    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Calculer le nouveau statut
      const newStatus = isPaid
        ? PayrollChargePaymentStatus.PAID
        : isPartial
          ? PayrollChargePaymentStatus.PARTIAL
          : PayrollChargePaymentStatus.PAID;

      // 2. Mettre à jour la charge
      const paid = await tx.payrollChargePayment.update({
        where: { id: chargePaymentId },
        data: {
          paidAmount: new Prisma.Decimal(paidAmount),
          paymentDate: new Date(),
          bankTransferId,
          status: newStatus,
          declarationNumber,
        },
      });

      // 3. Enqueue l'intention comptable (atomique avec le paiement)
      await this.outbox.enqueue(tx, {
        eventType: 'CHARGE_PAYMENT_ENTRY',
        subsidiaryId: charge.subsidiaryId,
        payload: {
          userId: 'system',
          operationDate: new Date().toISOString(),
          amount: paidAmount,
          description: `Paiement ${charge.chargeType} - ${charge.month}`,
          sourceId: chargePaymentId,
        },
      });

      return paid;
    });

    this.logger.log(
      `✅ Paiement enregistré: ${charge.chargeType} ${charge.month} → ${updated.status} + intention comptable enqueuée`,
    );

    return updated;
  }

  /**
   * Retourne les charges en retard.
   */
  async getOverdueCharges(
    subsidiaryId: string,
  ): Promise<PayrollChargePayment[]> {
    return this.prisma.payrollChargePayment.findMany({
      where: {
        subsidiaryId,
        dueDate: { lte: new Date() },
        status: {
          in: [
            PayrollChargePaymentStatus.ACCRUED,
            PayrollChargePaymentStatus.DUE,
            PayrollChargePaymentStatus.PARTIAL,
          ],
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  /**
   * Retourne les charges dues ce mois-ci.
   */
  async getChargesDueThisMonth(
    subsidiaryId: string,
  ): Promise<PayrollChargePayment[]> {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    return this.prisma.payrollChargePayment.findMany({
      where: {
        subsidiaryId,
        dueDate: {
          gte: firstDay,
          lte: lastDay,
        },
        status: {
          in: [
            PayrollChargePaymentStatus.ACCRUED,
            PayrollChargePaymentStatus.DUE,
            PayrollChargePaymentStatus.PARTIAL,
          ],
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  /**
   * Met à jour les statuts des charges (cron job).
   */
  async updateChargeStatusesCron(): Promise<number> {
    const now = new Date();

    const result = await this.prisma.payrollChargePayment.updateMany({
      where: {
        dueDate: { lte: now },
        status: PayrollChargePaymentStatus.ACCRUED,
      },
      data: { status: PayrollChargePaymentStatus.DUE },
    });

    if (result.count > 0) {
      this.logger.log(`📌 ${result.count} charges ACCRUED → DUE`);
    }

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const overdueCharges = await this.prisma.payrollChargePayment.findMany({
      where: {
        dueDate: { lte: sevenDaysAgo },
        status: {
          in: [
            PayrollChargePaymentStatus.DUE,
            PayrollChargePaymentStatus.PARTIAL,
          ],
        },
      },
    });

    let overdueCount = 0;
    for (const charge of overdueCharges) {
      if (Number(charge.paidAmount) < Number(charge.grossAmount)) {
        await this.prisma.payrollChargePayment.update({
          where: { id: charge.id },
          data: { status: PayrollChargePaymentStatus.OVERDUE },
        });
        overdueCount++;
      }
    }

    if (overdueCount > 0) {
      this.logger.warn(`🚨 ${overdueCount} charges maintenant OVERDUE`);
    }

    return result.count + overdueCount;
  }

  /**
   * Résumé des charges pour une période.
   */
  async getChargesSummary(
    subsidiaryId: string,
    startMonth: string,
    endMonth: string,
  ): Promise<{
    byChargeType: Record<
      string,
      { total: number; paid: number; pending: number; overdue: number }
    >;
    overallTotal: number;
    overallPaid: number;
    overallPending: number;
    overallOverdue: number;
  }> {
    const charges = await this.prisma.payrollChargePayment.findMany({
      where: {
        subsidiaryId,
        month: {
          gte: startMonth,
          lte: endMonth,
        },
      },
    });

    const summary = {
      byChargeType: {} as Record<
        string,
        { total: number; paid: number; pending: number; overdue: number }
      >,
      overallTotal: 0,
      overallPaid: 0,
      overallPending: 0,
      overallOverdue: 0,
    };

    for (const charge of charges) {
      const chargeType = charge.chargeType;
      const grossAmount = Number(charge.grossAmount);
      const paidAmount = Number(charge.paidAmount);
      const isPaid = charge.status === PayrollChargePaymentStatus.PAID;
      const isOverdue = charge.status === PayrollChargePaymentStatus.OVERDUE;

      if (!summary.byChargeType[chargeType]) {
        summary.byChargeType[chargeType] = {
          total: 0,
          paid: 0,
          pending: 0,
          overdue: 0,
        };
      }

      summary.byChargeType[chargeType].total += grossAmount;
      summary.byChargeType[chargeType].paid += paidAmount;
      if (!isPaid) {
        summary.byChargeType[chargeType].pending += grossAmount - paidAmount;
      }
      if (isOverdue) {
        summary.byChargeType[chargeType].overdue += grossAmount - paidAmount;
      }

      summary.overallTotal += grossAmount;
      summary.overallPaid += paidAmount;
      if (!isPaid) {
        summary.overallPending += grossAmount - paidAmount;
      }
      if (isOverdue) {
        summary.overallOverdue += grossAmount - paidAmount;
      }
    }

    return summary;
  }

  // ============================================================
  // HELPERS PRIVÉS
  // ============================================================

  private async getOrCreateBonusTypeId(
    subsidiaryId: string,
    code: string,
  ): Promise<string> {
    let bonusType = await this.prisma.payrollBonusType.findFirst({
      where: { subsidiaryId, code },
    });

    if (!bonusType) {
      this.logger.log(`📝 Création type bonus: ${code}`);

      const labelMap = {
        '13e_mois': '13e Mois',
        performance_bonus: 'Prime de Performance',
        severance: 'Indemnité de Fin de Contrat',
        retention_bonus: 'Prime de Rétention',
        payroll_bonus: 'Bonus de Paie',
      };

      bonusType = await this.prisma.payrollBonusType.create({
        data: {
          id: generateId(ID_PREFIXES.BONUS_TYPE),
          code,
          label: labelMap[code] || code,
          isTaxable: true,
          isSubjectToCnps: true,
          isSubjectToCfc: true,
          paymentTiming: code === '13e_mois' ? 'DECEMBER' : 'ON_TERMINATION',
          subsidiaryId,
        },
      });

      this.logger.log(`✅ Type bonus créé: ${bonusType.id}`);
    }

    return bonusType.id;
  }

  private calculateDueDate(chargeType: string, month: string): Date {
    const [year, monthNum] = month.split('-');
    const nextMonthDate = new Date(parseInt(year), parseInt(monthNum), 1);
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);

    switch (chargeType) {
      case 'CNPS':
        nextMonthDate.setDate(7);
        break;
      case 'IRPP':
      case 'CAC':
        nextMonthDate.setDate(15);
        break;
      case 'CFC':
      case 'FNE':
        nextMonthDate.setDate(0);
        break;
      default:
        nextMonthDate.setDate(0);
    }

    return nextMonthDate;
  }
}
