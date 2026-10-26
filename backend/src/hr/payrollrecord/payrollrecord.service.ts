import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { JournalizationService } from '../../accounting/journalization/journalization.service';
import { AccountingOutboxService } from '../../accounting/outbox/accounting-outbox.service';
import {
  CreatePayrollRecordDto,
  UpdatePayrollRecordDto,
} from './dto/payrollrecord.dto';
import {
  PayrollRecord,
  EmployeeStatus,
  PayrollStatus,
  Prisma,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';
import { PaginationQueryDto } from '../../common/pagination/dto/pagination-query.dto';
import { paginate, PaginatedResult } from '../../common/pagination/pagination';
import { CameroonPayrollCalculatorService } from './cameroonpayrollcalculator.service';
import { PayrollCumulativeService } from './payroll-cumulative.service';

// Type enrichi retourné par le service (avec infos employé)
type PayrollRecordWithDetails = PayrollRecord & {
  employee?: {
    firstName: string;
    lastName: string;
    baseSalary: Decimal;
    bonus: Decimal | null;
  };
  subsidiary?: {
    id: string;
    subsidiaryName: string;
  };
};

@Injectable()
export class PayrollRecordService {
  private readonly logger = new Logger(PayrollRecordService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly calculator: CameroonPayrollCalculatorService,
    private readonly journalization: JournalizationService,
    private readonly outbox: AccountingOutboxService,
    private readonly cumulative: PayrollCumulativeService,
  ) {}

  /**
   * Crée une fiche de paie manuellement (avec ou sans calcul automatique)
   */
  async create(
    dto: CreatePayrollRecordDto,
    employeeId: string,
    subsidiaryId: string,
  ): Promise<PayrollRecord> {
    this.logger.log(
      `Création fiche de paie pour employé ${employeeId} - période ${dto.payrollPeriod}`,
    );

    const existing = await this.prisma.payrollRecord.findUnique({
      where: {
        employeeId_payrollPeriod: {
          employeeId,
          payrollPeriod: dto.payrollPeriod,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Une fiche de paie existe déjà pour cet employé sur la période ${dto.payrollPeriod}`,
      );
    }

    let calculated = null;
    if (!dto.grossSalary || dto.grossSalary === 0) {
      const employee = await this.prisma.employee.findUnique({
        where: { id: employeeId },
      });

      if (!employee) {
        throw new NotFoundException(`Employé ${employeeId} introuvable`);
      }
      const payrollConfig = await this.prisma.payrollConfiguration.findUnique({
        where: { subsidiaryId },
      });

      calculated = this.calculator.calculate({
        baseSalary: Number(employee.baseSalary),
        bonus: Number(employee.bonus || 0),
        allowances: Number(dto.allowances || 0),
        overtime: Number(dto.overtime || 0),
        riskGroup: 'A',
        applyCfc: true,
        applyFne: true,
        payrollConfig: this.getCalculatorConfig(payrollConfig),
      });
    }

    const data: Prisma.PayrollRecordCreateInput = {
      id: generateId(ID_PREFIXES.PAYROLL),
      employeeName: dto.employeeName,
      payrollPeriod: dto.payrollPeriod,

      // Rémunération
      baseSalary: dto.baseSalary ?? calculated?.grossSalary ?? 0,
      bonus: dto.bonus ?? 0,
      allowances: dto.allowances ?? 0,
      overtime: dto.overtime ?? 0,
      otherEarnings: dto.otherEarnings ?? 0,
      grossSalary: dto.grossSalary ?? calculated?.grossSalary ?? 0,

      // Retenues salariales
      cnpsEmployee: dto.cnpsEmployee ?? calculated?.cnpsEmployee ?? 0,
      cfcEmployee: dto.cfcEmployee ?? calculated?.cfcEmployee ?? 0,
      irpp: dto.irpp ?? calculated?.irpp ?? 0,
      cac: dto.cac ?? calculated?.cac ?? 0,
      otherDeductions: dto.otherDeductions ?? 0,
      deductions: dto.deductions ?? calculated?.totalDeductions ?? 0,
      netSalary: dto.netSalary ?? calculated?.netSalary ?? 0,

      // Charges patronales
      cnpsEmployer: dto.cnpsEmployer ?? calculated?.totalEmployerCharges ?? 0,
      cfcEmployer: dto.cfcEmployer ?? calculated?.cfcEmployer ?? 0,
      fne: dto.fne ?? calculated?.fne ?? 0,
      totalEmployerCost:
        dto.totalEmployerCost ?? calculated?.totalEmployerCost ?? 0,

      deductionsDetail:
        calculated?.deductionsDetail ?? dto.deductionsDetail ?? null,
      calculationMeta: calculated
        ? {
            riskGroup: 'A',
            cnpsCap: 750000,
            calculatedAt: new Date().toISOString(),
          }
        : null,

      paymentDate: dto.paymentDate,
      signature: dto.signature,
      status: dto.status ?? PayrollStatus.PENDING,
      notes: dto.notes,

      employee: { connect: { id: employeeId } },
      subsidiary: { connect: { id: subsidiaryId } },
    };

    return this.prisma.payrollRecord.create({
      data,
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            baseSalary: true,
            bonus: true,
          },
        },
      },
    });
  }

  /**
   * Récupère toutes les fiches de paie d'une filiale
   */
  async findAll(
    subsidiaryId?: string,
    paginationQuery: PaginationQueryDto = {},
  ): Promise<PaginatedResult<PayrollRecordWithDetails>> {
    const where: Prisma.PayrollRecordWhereInput = subsidiaryId
      ? { subsidiaryId }
      : {};

    if (paginationQuery.search) {
      where.OR = [
        {
          employeeName: {
            contains: paginationQuery.search,
            mode: 'insensitive',
          },
        },
        {
          payrollPeriod: {
            contains: paginationQuery.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    return paginate<PayrollRecordWithDetails>(
      this.prisma.payrollRecord as any,
      {
        where,
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true,
              baseSalary: true,
              bonus: true,
            },
          },
        },
        orderBy: [{ payrollPeriod: 'desc' }, { employeeName: 'asc' }],
      },
      paginationQuery,
    );
  }

  /**
   * Récupère toutes les fiches de paie de toutes les filiales (vue globale SUPER_ADMIN)
   */
  async findAllGlobal(): Promise<PayrollRecordWithDetails[]> {
    return this.prisma.payrollRecord.findMany({
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            baseSalary: true,
            bonus: true,
          },
        },
        subsidiary: {
          select: {
            id: true,
            subsidiaryName: true,
          },
        },
      },
      orderBy: [{ payrollPeriod: 'desc' }, { employeeName: 'asc' }],
    });
  }

  /**
   * Récupère une fiche de paie par ID
   */
  async findOne(id: string): Promise<PayrollRecordWithDetails> {
    const record = await this.prisma.payrollRecord.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            baseSalary: true,
            bonus: true,
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundException(`Fiche de paie ${id} introuvable`);
    }

    return record;
  }

  /**
   * Met à jour une fiche de paie
   */
  async update(
    id: string,
    dto: UpdatePayrollRecordDto,
  ): Promise<PayrollRecord> {
    await this.findOne(id);

    const current = await this.prisma.payrollRecord.findUnique({
      where: { id },
    });

    if (current?.status === PayrollStatus.PAID) {
      throw new BadRequestException(
        'Impossible de modifier une fiche de paie déjà payée',
      );
    }

    const { employeeId, ...updateData } = dto as any;

    const gross = updateData.grossSalary ?? Number(current.grossSalary);
    const deductions = updateData.deductions ?? Number(current.deductions);

    return this.prisma.payrollRecord.update({
      where: { id },
      data: {
        ...updateData,
        deductions: updateData.deductions,
        netSalary:
          updateData.netSalary ??
          (gross !== undefined && deductions !== undefined
            ? Number(gross) - Number(deductions)
            : undefined),
      },
    });
  }

  /**
   * Supprime une fiche de paie
   */
  async remove(id: string): Promise<PayrollRecord> {
    const record = await this.findOne(id);

    if (record.status === PayrollStatus.PAID) {
      throw new BadRequestException(
        'Impossible de supprimer une fiche de paie déjà payée',
      );
    }

    return this.prisma.payrollRecord.delete({ where: { id } });
  }

  /**
   * Signe une fiche de paie et la passe en statut PAID.
   * Enqueue l'intention comptable via Outbox Pattern (traitement asynchrone par le Processor).
   */
  async signPayrollRecord(
    id: string,
    signature: string,
    userId: string = 'system',
  ): Promise<PayrollRecordWithDetails> {
    this.logger.log(`Signature de la fiche de paie ${id}`);

    const record = await this.findOne(id);

    if (record.status === PayrollStatus.PAID) {
      throw new BadRequestException(
        'Cette fiche de paie est déjà signée/payée',
      );
    }

    // Transaction atomique : signature + enqueue outbox
    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Signer la fiche
      const payroll = await tx.payrollRecord.update({
        where: { id },
        data: {
          signature,
          status: PayrollStatus.PAID,
          paymentDate: new Date(),
        },
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true,
              baseSalary: true,
              bonus: true,
            },
          },
          subsidiary: { select: { id: true, subsidiaryName: true } },
        },
      });

      // 2. Enqueue l'intention comptable (atomique avec la signature)
      await this.outbox.enqueue(tx, {
        eventType: 'PAYROLL_ENTRY',
        subsidiaryId: payroll.subsidiaryId,
        payload: {
          userId,
          operationDate:
            payroll.paymentDate?.toISOString() || new Date().toISOString(),
          amount: Number(payroll.grossSalary),
          description: `Paie ${payroll.payrollPeriod} - ${payroll.employeeName}`,
          sourceId: payroll.id,
        },
      });

      this.logger.log(
        `✅ Fiche signée + intention comptable enqueuée pour ${payroll.id}`,
      );

      return payroll;
    });

    return updated;
  }

  /**
   * Traite la paie d'une filiale pour une période donnée.
   * Crée automatiquement les fiches de paie pour tous les employés actifs
   * qui n'en ont pas encore pour cette période.
   * Si forceRegenerate=true, regénère les fiches existantes avec les données actuelles de l'employé.
   */
  async processPayroll(
    subsidiaryId: string,
    period: string,
    options?: {
      riskGroup?: 'A' | 'B' | 'C';
      applyCfc?: boolean;
      applyFne?: boolean;
      forceRegenerate?: boolean;
    },
  ): Promise<{ count: number; message: string; regenerated?: number }> {
    this.logger.log(
      `Traitement de la paie - Filiale: ${subsidiaryId} | Période: ${period}`,
    );

    // --- Validations ---
    if (!subsidiaryId?.trim()) {
      throw new BadRequestException('subsidiaryId manquant');
    }

    if (!/^\d{4}-\d{2}$/.test(period)) {
      throw new BadRequestException(
        'Format de période invalide. Utilisez YYYY-MM (ex: 2026-07)',
      );
    }

    const payrollConfig = await this.prisma.payrollConfiguration.findUnique({
      where: { subsidiaryId },
    });

    // --- 1. Récupérer les employés ACTIVE de la filiale ---
    const activeEmployees = await this.prisma.employee.findMany({
      where: {
        subsidiaryId,
        status: EmployeeStatus.ACTIVE,
      },
    });

    // Diagnostic si aucun employé ACTIVE
    if (activeEmployees.length === 0) {
      const allEmployees = await this.prisma.employee.findMany({
        where: { subsidiaryId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          status: true,
        },
      });

      this.logger.warn(
        `Aucun employé ACTIVE pour subsidiaryId=${subsidiaryId}. ` +
          `Total employés de la filiale: ${allEmployees.length}`,
      );
      this.logger.warn(
        `Détail statuts: ${JSON.stringify(
          allEmployees.map((e) => ({
            name: `${e.firstName} ${e.lastName}`,
            status: e.status,
          })),
        )}`,
      );

      if (allEmployees.length === 0) {
        return {
          count: 0,
          message: `Aucun employé trouvé pour cette filiale (subsidiaryId=${subsidiaryId}). Vérifiez que les employés sont bien rattachés à cette filiale.`,
        };
      }

      // Il y a des employés, mais aucun n'est ACTIVE
      const statuses = [...new Set(allEmployees.map((e) => e.status))];
      return {
        count: 0,
        message: `Aucun employé actif trouvé. ${allEmployees.length} employé(s) présent(s) avec le(s) statut(s): ${statuses.join(', ')}. Passez leur statut à ACTIVE pour générer la paie.`,
      };
    }

    // --- 2. Fiches déjà existantes pour cette période ---
    const existingPayrolls = await this.prisma.payrollRecord.findMany({
      where: {
        subsidiaryId,
        payrollPeriod: period,
        employeeId: { in: activeEmployees.map((e) => e.id) },
      },
      select: { id: true, employeeId: true, status: true },
    });

    const existingEmployeeIds = new Set(
      existingPayrolls.map((p) => p.employeeId),
    );

    // --- 3. Déterminer les employés à traiter ---
    let employeesToProcess = activeEmployees.filter(
      (e) => !existingEmployeeIds.has(e.id),
    );

    let regenerated = 0;

    // Si forceRegenerate, supprimer les fiches existantes et traiter tous les employés
    if (options?.forceRegenerate && existingPayrolls.length > 0) {
      const protectedPayrolls = existingPayrolls.filter((payroll) =>
        ([PayrollStatus.SIGNED, PayrollStatus.PAID] as PayrollStatus[]).includes(payroll.status),
      );
      if (protectedPayrolls.length > 0) {
        throw new ConflictException(
          `Régénération refusée : ${protectedPayrolls.length} fiche(s) sont signées ou payées. Corrigez-les par un processus de régularisation.`,
        );
      }
      this.logger.log(
        `🔄 Mode régénération: suppression de ${existingPayrolls.length} fiche(s) existante(s)`,
      );

      await this.prisma.payrollRecord.deleteMany({
        where: {
          id: { in: existingPayrolls.map((p) => p.id) },
        },
      });

      regenerated = existingPayrolls.length;
      employeesToProcess = activeEmployees; // Traiter TOUS les employés
    }

    if (employeesToProcess.length === 0) {
      this.logger.log(
        `Tous les employés actifs ont déjà une fiche de paie pour ${period}`,
      );
      return {
        count: 0,
        message: `Tous les employés actifs ont déjà une fiche pour ${period}. Utilisez forceRegenerate=true pour regénérer.`,
        regenerated: 0,
      };
    }

    // --- 4. Calcul et préparation des données ---
    const riskGroup = options?.riskGroup ?? 'A';
    const applyCfc = options?.applyCfc ?? true;
    const applyFne = options?.applyFne ?? true;

    // Recalculer les cumuls précédant la période à partir des fiches source.
    // Cela évite de reprendre une fiche du même mois lors d'une régénération,
    // et reste exact même si le cumul matérialisé doit être réparé.
    const year = period.substring(0, 4);
    const previousPayrolls = await this.prisma.payrollRecord.findMany({
      where: {
        subsidiaryId,
        payrollPeriod: { gte: `${year}-01`, lt: period },
        employeeId: { in: employeesToProcess.map((e) => e.id) },
      },
      select: { employeeId: true, grossSalary: true, cnpsEmployee: true, irpp: true },
    });
    const cumulativesMap = new Map<string, { gross: number; cnps: number; irpp: number }>();
    previousPayrolls.forEach((payroll) => {
      const previous = cumulativesMap.get(payroll.employeeId) ?? { gross: 0, cnps: 0, irpp: 0 };
      previous.gross += Number(payroll.grossSalary);
      previous.cnps += Number(payroll.cnpsEmployee);
      previous.irpp += Number(payroll.irpp);
      cumulativesMap.set(payroll.employeeId, previous);
    });

    const newPayrollsData = employeesToProcess.map((employee) => {
      // Récupérer les cumuls pour cet employé
      const employeeCumulative = cumulativesMap.get(employee.id);
      const previousCnpsCumulative = employeeCumulative?.cnps ?? 0;
      const previousIrppCumulative = employeeCumulative?.irpp ?? 0;
      const previousGrossCumulative = employeeCumulative?.gross ?? 0;

      // Convertir les indemnities en allowances (sum)
      const totalIndemnities = Array.isArray(employee.indemnities)
        ? (employee.indemnities as any[]).reduce(
            (sum, ind) => sum + (Number(ind.amount) || 0),
            0,
          )
        : 0;

      const calc = this.calculator.calculate({
        baseSalary: Number(employee.baseSalary),
        bonus: Number(employee.bonus || 0),
        allowances: totalIndemnities,
        riskGroup,
        applyCfc,
        applyFne,
        // Phase 4: Passer les cumuls pour calculs progressifs
        previousCnpsCumulative,
        previousIrppCumulative,
        previousGrossCumulative,
        payrollConfig: this.getCalculatorConfig(payrollConfig),
      });

      return {
        id: generateId(ID_PREFIXES.PAYROLL),
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        payrollPeriod: period,

        baseSalary: employee.baseSalary,
        bonus: employee.bonus || 0,
        allowances: totalIndemnities,
        overtime: 0,
        otherEarnings: 0,
        grossSalary: calc.grossSalary,

        cnpsEmployee: calc.cnpsEmployee,
        cfcEmployee: calc.cfcEmployee,
        irpp: calc.irpp,
        cac: calc.cac,
        otherDeductions: 0,
        deductions: calc.totalDeductions,
        netSalary: calc.netSalary,

        cnpsEmployer:
          calc.cnpsEmployerPension +
          calc.cnpsFamilyBenefits +
          calc.cnpsAccidentRisk,
        cfcEmployer: calc.cfcEmployer,
        fne: calc.fne,
        totalEmployerCost: calc.totalEmployerCost,

        deductionsDetail: [
          ...calc.deductionsDetail,
          // Ajouter les indemnités au détail
          ...(Array.isArray(employee.indemnities) &&
          employee.indemnities.length > 0
            ? employee.indemnities.map((ind: any) => ({
                label: `Indemnité - ${ind.type}`,
                amount: Number(ind.amount),
                type: 'INDEMNITIES',
              }))
            : []),
        ],
        calculationMeta: {
          riskGroup,
          cnpsCap: Number(payrollConfig?.cnpsCap ?? 750000),
          cnpsEmployeeRate: Number(payrollConfig?.cnpsEmployeeRate ?? 0.042),
          cfcEmployeeRate: applyCfc ? 0.01 : 0,
          totalIndemnities,
          calculatedAt: new Date().toISOString(),
        },

        status: PayrollStatus.PENDING,
        subsidiaryId,
      };
    });

    // --- 5. Création en masse ---
    const result = await this.prisma.payrollRecord.createMany({
      data: newPayrollsData,
      skipDuplicates: true,
    });

    this.logger.log(
      `✅ ${result.count} fiche(s) de paie créée(s) pour la période ${period}`,
    );

    // --- 6. Mettre à jour les cumuls et détails de déductions (en arrière-plan) ---
    try {
      await this.updateCumulativesForPeriod(subsidiaryId, period);
    } catch (error) {
      this.logger.warn(
        `⚠️ Erreur lors de la mise à jour des cumuls: ${error.message}`,
      );
      // Ne pas lever l'erreur - la paie est déjà créée
    }

    let message = `${result.count} fiche(s) de paie générée(s) avec succès pour ${period}`;
    if (regenerated > 0) {
      message = `🔄 ${regenerated} fiche(s) régénérée(s) + ${result.count} nouvelle(s) créée(s) pour ${period}`;
    }

    return {
      count: result.count,
      message,
      regenerated,
    };
  }

  /**
   * Mettre à jour les cumuls et détails de déductions pour une période
   * (appelé après la création en masse des fiches)
   */
  private async updateCumulativesForPeriod(
    subsidiaryId: string,
    period: string,
  ): Promise<void> {
    const newPayrolls = await this.prisma.payrollRecord.findMany({
      where: {
        subsidiaryId,
        payrollPeriod: period,
        status: PayrollStatus.PENDING,
      },
    });

    this.logger.log(
      `📊 Mise à jour des cumuls pour ${newPayrolls.length} fiche(s)`,
    );

    for (const payroll of newPayrolls) {
      try {
        // Les cumuls sont reconstruits depuis les fiches existantes afin que
        // relancer le traitement d'une période ne double jamais les montants.
        const year = payroll.payrollPeriod.substring(0, 4);
        const annualRecords = await this.prisma.payrollRecord.findMany({
          where: { employeeId: payroll.employeeId, payrollPeriod: { startsWith: year } },
          orderBy: { payrollPeriod: 'desc' },
        });
        const totals = annualRecords.reduce((acc, record) => ({
          gross: acc.gross + Number(record.grossSalary),
          deductions: acc.deductions + Number(record.deductions),
          net: acc.net + Number(record.netSalary),
          cnps: acc.cnps + Number(record.cnpsEmployee),
          cfc: acc.cfc + Number(record.cfcEmployee),
          irpp: acc.irpp + Number(record.irpp),
          cac: acc.cac + Number(record.cac),
        }), { gross: 0, deductions: 0, net: 0, cnps: 0, cfc: 0, irpp: 0, cac: 0 });
        await this.prisma.payrollCumulative.upsert({
          where: { employeeId_year_month: { employeeId: payroll.employeeId, year, month: null } },
          create: {
            id: generateId(ID_PREFIXES.PAYROLL_CUMULATIVE),
            employeeId: payroll.employeeId,
            subsidiaryId: payroll.subsidiaryId,
            year,
            month: null,
            grossCumululative: new Prisma.Decimal(totals.gross),
            deductionsCumululative: new Prisma.Decimal(totals.deductions),
            netCumululative: new Prisma.Decimal(totals.net),
            cnpsCumulative: new Prisma.Decimal(totals.cnps),
            cfcCumulative: new Prisma.Decimal(totals.cfc),
            irppCumulative: new Prisma.Decimal(totals.irpp),
            cacCumulative: new Prisma.Decimal(totals.cac),
            lastPayrollId: annualRecords[0]?.id ?? null,
          },
          update: {
            grossCumululative: new Prisma.Decimal(totals.gross),
            deductionsCumululative: new Prisma.Decimal(totals.deductions),
            netCumululative: new Prisma.Decimal(totals.net),
            cnpsCumulative: new Prisma.Decimal(totals.cnps),
            cfcCumulative: new Prisma.Decimal(totals.cfc),
            irppCumulative: new Prisma.Decimal(totals.irpp),
            cacCumulative: new Prisma.Decimal(totals.cac),
            lastPayrollId: annualRecords[0]?.id ?? null,
          },
        });

        // Créer les détails de déductions
        await this.prisma.payrollDeductionDetail.deleteMany({ where: { payrollRecordId: payroll.id } });
        await this.cumulative.createDeductionDetails(
          this.prisma as unknown as Prisma.TransactionClient,
          payroll.id,
          {
            cnpsEmployee: Number(payroll.cnpsEmployee),
            cfcEmployee: Number(payroll.cfcEmployee),
            irpp: Number(payroll.irpp),
            cac: Number(payroll.cac),
            otherDeductions: Number(payroll.otherDeductions),
          },
          Number(payroll.grossSalary),
        );
      } catch (error) {
        this.logger.warn(
          `⚠️ Erreur cumul pour ${payroll.id}: ${error.message}`,
        );
      }
    }

    this.logger.log(`✅ Cumuls et détails mis à jour`);
  }

  /**
   * Simule le calcul de paie pour un employé (sans sauvegarder)
   */
  async simulatePayroll(
    employeeId: string,
    options?: {
      bonus?: number;
      allowances?: number;
      overtime?: number;
      riskGroup?: 'A' | 'B' | 'C';
    },
  ) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException(`Employé ${employeeId} introuvable`);
    }

    const payrollConfig = await this.prisma.payrollConfiguration.findUnique({
      where: { subsidiaryId: employee.subsidiaryId },
    });

    const result = this.calculator.calculate({
      baseSalary: Number(employee.baseSalary),
      bonus: options?.bonus ?? Number(employee.bonus || 0),
      allowances: options?.allowances ?? 0,
      overtime: options?.overtime ?? 0,
      riskGroup: options?.riskGroup ?? 'A',
      applyCfc: true,
      applyFne: true,
      payrollConfig: this.getCalculatorConfig(payrollConfig),
    });

    return {
      employee: {
        id: employee.id,
        fullName: `${employee.firstName} ${employee.lastName}`,
        baseSalary: employee.baseSalary,
      },
      simulation: result,
    };
  }

  /**
   * Récupère les fiches de paie d'un employé
   */
  async findByEmployee(employeeId: string, subsidiaryId?: string): Promise<PayrollRecord[]> {
    return this.prisma.payrollRecord.findMany({
      where: { employeeId, ...(subsidiaryId ? { subsidiaryId } : {}) },
      orderBy: { payrollPeriod: 'desc' },
    });
  }

  async findEmployeeForScope(employeeId: string): Promise<{ subsidiaryId: string }> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { subsidiaryId: true },
    });
    if (!employee) throw new NotFoundException(`Employé ${employeeId} introuvable`);
    return employee;
  }

  /**
   * Récupère les fiches de paie d'une période pour une filiale
   */
  async findByPeriod(
    subsidiaryId: string,
    period: string,
  ): Promise<PayrollRecordWithDetails[]> {
    return this.prisma.payrollRecord.findMany({
      where: {
        subsidiaryId,
        payrollPeriod: period,
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            baseSalary: true,
            bonus: true,
          },
        },
      },
      orderBy: { employeeName: 'asc' },
    });
  }

  private getCalculatorConfig(config: {
    cnpsEmployeeRate: Prisma.Decimal;
    cnpsEmployerRate: Prisma.Decimal;
    cfcEmployeeRate: Prisma.Decimal;
    cfcEmployerRate: Prisma.Decimal;
    fneRate: Prisma.Decimal;
    cnpsCap: Prisma.Decimal;
    professionalExpenseRate: Prisma.Decimal;
    fixedAbatementAnnual: Prisma.Decimal;
    riskGroupARate: Prisma.Decimal;
    riskGroupBRate: Prisma.Decimal;
    riskGroupCRate: Prisma.Decimal;
  } | null) {
    if (!config) return undefined;
    return {
      cnpsEmployeeRate: Number(config.cnpsEmployeeRate),
      cnpsEmployerRate: Number(config.cnpsEmployerRate),
      cfcEmployeeRate: Number(config.cfcEmployeeRate),
      cfcEmployerRate: Number(config.cfcEmployerRate),
      fneRate: Number(config.fneRate),
      cnpsCap: Number(config.cnpsCap),
      professionalExpenseRate: Number(config.professionalExpenseRate),
      fixedAbatementAnnual: Number(config.fixedAbatementAnnual),
      riskGroupARate: Number(config.riskGroupARate),
      riskGroupBRate: Number(config.riskGroupBRate),
      riskGroupCRate: Number(config.riskGroupCRate),
    };
  }
}
