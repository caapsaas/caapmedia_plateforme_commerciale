
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { CreateAbsenceRecordDto, UpdateAbsenceRecordDto } from './dto/absencerecord.dto';
import { AbsenceRecord } from '@prisma/client';

@Injectable()
export class AbsenceRecordService {
  private readonly logger = new Logger(AbsenceRecordService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAbsenceRecordDto, employeeId: string, subsidiaryId: string): Promise<AbsenceRecord> {
    this.logger.log(`Creating absence record for employee ${employeeId}`);
    return this.prisma.absenceRecord.create({
      data: {
        employeeName: dto.employeeName,
        typeAbsence: dto.typeAbsence,
        startDate: dto.startDate,
        endDate: dto.endDate,
        reason: dto.reason,
        documentUrl: dto.documentUrl,
        employeeId,
        subsidiaryId,
      },
      include: { employee: true, subsidiary: true },
    });
  }

  async findAll(subsidiaryId: string) {
    return this.prisma.absenceRecord.findMany({
      where: { subsidiaryId },
      include: { employee: true },
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(id: string): Promise<AbsenceRecord> {
    const record = await this.prisma.absenceRecord.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!record) {
      throw new NotFoundException(`Absence record with ID ${id} not found.`);
    }
    return record;
  }

  async update(id: string, dto: UpdateAbsenceRecordDto): Promise<AbsenceRecord> {
    this.logger.log(`Updating absence record ${id}`);
    await this.findOne(id); // Vérifie si l'enregistrement existe
    return this.prisma.absenceRecord.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string): Promise<AbsenceRecord> {
    this.logger.log(`Removing absence record ${id}`);
    await this.findOne(id); // Vérifie si l'enregistrement existe
    return this.prisma.absenceRecord.delete({ where: { id } });
  }
}