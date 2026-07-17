import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import {
  CreateAbsenceRecordDto,
  UpdateAbsenceRecordDto,
} from './dto/absencerecord.dto';
import { AbsenceRecord, Prisma } from '@prisma/client'; // Import AbsenceType

@Injectable()
export class AbsenceRecordService {
  private readonly logger = new Logger(AbsenceRecordService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateAbsenceRecordDto,
    employeeId: string,
    subsidiaryId: string,
  ): Promise<AbsenceRecord> {
    this.logger.log(
      `Creating absence record for employee ${employeeId} with data: ${JSON.stringify(dto)}`,
    );
    if (!dto.typeAbsence) {
      // Explicitly check if typeAbsence is missing or undefined
      throw new BadRequestException('Absence type (typeAbsence) is required.');
    }
    return this.prisma.absenceRecord.create({
      data: {
        employeeName: dto.employeeName,
        typeAbsence: dto.typeAbsence,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
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

  async update(
    id: string,
    dto: UpdateAbsenceRecordDto,
  ): Promise<AbsenceRecord> {
    this.logger.log(`Updating absence record ${id}`);
    await this.findOne(id); // Vérifie si l'enregistrement existe

    // On ne construit l'objet de mise à jour qu'avec les champs pertinents
    const dataToUpdate: Prisma.AbsenceRecordUpdateInput = {};
    if (dto.typeAbsence) dataToUpdate.typeAbsence = dto.typeAbsence;
    if (dto.startDate) dataToUpdate.startDate = new Date(dto.startDate);
    if (dto.endDate) dataToUpdate.endDate = new Date(dto.endDate);
    if (dto.reason !== undefined) dataToUpdate.reason = dto.reason;
    if (dto.documentUrl !== undefined)
      dataToUpdate.documentUrl = dto.documentUrl;
    // On ne permet pas de changer l'employé ou la filiale via cette méthode

    return this.prisma.absenceRecord.update({
      where: { id },
      data: dataToUpdate,
      include: { employee: true, subsidiary: true },
    });
  }

  async remove(id: string): Promise<AbsenceRecord> {
    this.logger.log(`Removing absence record ${id}`);
    await this.findOne(id); // Vérifie si l'enregistrement existe
    return this.prisma.absenceRecord.delete({ where: { id } });
  }
}
