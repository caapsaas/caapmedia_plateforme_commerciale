import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { CreateAttendanceRecordDto, UpdateAttendanceRecordDto } from './dto/atendancerecord.dto';
import { AttendanceRecord } from '@prisma/client';
import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';

@Injectable()
export class AttendanceRecordService {
  private readonly logger = new Logger(AttendanceRecordService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createAttendanceRecordDto: CreateAttendanceRecordDto, employeeId: string, subsidiaryId: string): Promise<AttendanceRecord> {
    this.logger.log(`Creating attendance record for employee ${employeeId}`);
    return this.prisma.attendanceRecord.create({
      data: {
        id: generateId(ID_PREFIXES.ATTENDANCE),
        employeeName: createAttendanceRecordDto.employeeName ?? '', // Fournir une valeur par défaut
        attendanceDate: createAttendanceRecordDto.attendanceDate,
        status: createAttendanceRecordDto.status,
        arrivalTime: createAttendanceRecordDto.arrivalTime,
        departureTime: createAttendanceRecordDto.departureTime,
        breakStartTime: createAttendanceRecordDto.breakStartTime,
        breakEndTime: createAttendanceRecordDto.breakEndTime,
        signature: createAttendanceRecordDto.signature,
        employeeId: employeeId, // Utilise l'ID de l'employé passé en argument
        subsidiaryId: subsidiaryId, // Utilise l'ID de la filiale passé en argument
      },
      include: {
        employee: true,
        subsidiary: true,
      },
    });
  }

  async findAll(subsidiaryId: string): Promise<AttendanceRecord[]> {
    return this.prisma.attendanceRecord.findMany({
      where: { subsidiaryId },
      include: { employee: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { attendanceDate: 'desc' },
    });
  }

  async findOne(id: string): Promise<AttendanceRecord> {
    const record = await this.prisma.attendanceRecord.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!record) throw new NotFoundException(`Attendance record ${id} not found`);
    return record;
  }

  async update(id: string, updateAttendanceRecordDto: UpdateAttendanceRecordDto): Promise<AttendanceRecord> {
    this.logger.log(`Updating attendance record ${id}`);
    await this.findOne(id); // Vérifie si l'enregistrement existe
    return this.prisma.attendanceRecord.update({
      where: { id },
      data: updateAttendanceRecordDto,
      include: { employee: true },
    });
  }

  async remove(id: string): Promise<AttendanceRecord> {
    this.logger.log(`Removing attendance record ${id}`);
    await this.findOne(id); // Vérifie si l'enregistrement existe
    return this.prisma.attendanceRecord.delete({ where: { id } });
  }
}