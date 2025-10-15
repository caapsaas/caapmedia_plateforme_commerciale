import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { CreatePayrollRecordDto, UpdatePayrollRecordDto } from './dto/payrollrecord.dto';
import { PayrollRecord, EmployeeStatus, PayrollStatus } from '@prisma/client';

@Injectable()
export class PayrollRecordService {
  private readonly logger = new Logger(PayrollRecordService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePayrollRecordDto, employeeId: string, subsidiaryId: string): Promise<PayrollRecord> {
    this.logger.log(`Creating payroll record for employee ${employeeId} in subsidiary ${subsidiaryId}`);
    // Calcul netSalary si pas fourni : gross - deductions
    const netSalary = dto.netSalary ?? (Number(dto.grossSalary) - Number(dto.deductions));

    return this.prisma.payrollRecord.create({
      data: {
        employeeName: dto.employeeName,
        payrollPeriod: dto.payrollPeriod,
        grossSalary: dto.grossSalary,
        deductions: dto.deductions,
        netSalary: netSalary,
        paymentDate: dto.paymentDate,
        status: dto.status,
        signature: dto.signature,
        employeeId: employeeId,
        subsidiaryId: subsidiaryId,
      },
      include: { employee: true },
    });
  }

  async findAll(subsidiaryId: string) {
    return this.prisma.payrollRecord.findMany({
      where: { subsidiaryId },
      include: { employee: { select: { firstName: true, lastName: true } } },
      orderBy: { payrollPeriod: 'desc' },
    });
  }

  async findOne(id: string): Promise<PayrollRecord> {
    const record = await this.prisma.payrollRecord.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!record) {
      throw new NotFoundException(`Payroll record with ID ${id} not found.`);
    }
    return record;
  }

  async update(id: string, dto: UpdatePayrollRecordDto): Promise<PayrollRecord> {
    await this.findOne(id); // Vérifie l'existence
    return this.prisma.payrollRecord.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string): Promise<PayrollRecord> {
    await this.findOne(id); // Vérifie l'existence
    return this.prisma.payrollRecord.delete({ where: { id } });
  }

  /**
   * Traite la paie pour une filiale et une période données.
   * Crée des fiches de paie pour tous les employés actifs qui n'en ont pas encore pour cette période.
   * @param subsidiaryId L'ID de la filiale.
   * @param period La période de paie (ex: "YYYY-MM").
   */
  async processPayroll(subsidiaryId: string, period: string): Promise<{ count: number }> {
    this.logger.log(`Processing payroll for subsidiary ${subsidiaryId} for period ${period}`);

    // 1. Récupérer les employés actifs de la filiale
    const activeEmployees = await this.prisma.employee.findMany({
      where: {
        subsidiaryId,
        status: EmployeeStatus.ACTIVE,
      },
    });

    if (activeEmployees.length === 0) {
      this.logger.warn(`No active employees found for subsidiary ${subsidiaryId}.`);
      return { count: 0 };
    }

    // 2. Récupérer les fiches de paie déjà existantes pour cette période
    const existingPayrolls = await this.prisma.payrollRecord.findMany({
      where: {
        subsidiaryId,
        payrollPeriod: period,
        employeeId: { in: activeEmployees.map(e => e.id) },
      },
      select: { employeeId: true },
    });
    const existingEmployeeIds = new Set(existingPayrolls.map(p => p.employeeId));

    // 3. Filtrer les employés qui n'ont pas encore de fiche de paie
    const employeesToProcess = activeEmployees.filter(e => !existingEmployeeIds.has(e.id));

    if (employeesToProcess.length === 0) {
      this.logger.log(`All active employees already have a payroll record for period ${period}.`);
      return { count: 0 };
    }

    // 4. Créer les nouvelles fiches de paie en une seule transaction
    const newPayrollsData = employeesToProcess.map(employee => ({
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      payrollPeriod: period,
      grossSalary: employee.baseSalary, // Utilise le salaire de base de l'employé
      deductions: 0, // Initialisé à 0
      netSalary: employee.baseSalary, // Initialisé au salaire de base
      status: PayrollStatus.PENDING,
      subsidiaryId: subsidiaryId,
    }));

    const result = await this.prisma.payrollRecord.createMany({
      data: newPayrollsData,
      skipDuplicates: true, // Au cas où, pour éviter les erreurs de concurrence
    });

    this.logger.log(`Successfully created ${result.count} new payroll records.`);
    return { count: result.count };
  }
}