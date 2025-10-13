import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { CreatePayrollRecordDto, UpdatePayrollRecordDto } from './dto/payrollrecord.dto';
import { PayrollRecord } from '@prisma/client';

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
}