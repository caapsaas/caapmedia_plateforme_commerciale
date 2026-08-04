import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import {
  CreateAttendanceRecordDto,
  UpdateAttendanceRecordDto,
} from './dto/atendancerecord.dto';
import { AttendanceRecord } from '@prisma/client';
import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';
import { paginate } from 'src/common/pagination/pagination';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';

@Injectable()
export class AttendanceRecordService {
  private readonly logger = new Logger(AttendanceRecordService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    createAttendanceRecordDto: CreateAttendanceRecordDto,
    employeeId: string,
    subsidiaryId: string,
  ): Promise<AttendanceRecord> {
    this.logger.log(`Creating attendance record for employee ${employeeId}`);

    const existingToday = await this.findTodayRecord(employeeId, subsidiaryId);
    if (existingToday) {
      throw new BadRequestException(
        "Un enregistrement de présence existe déjà pour aujourd'hui",
      );
    }

    return this.prisma.attendanceRecord.create({
      data: {
        id: generateId(ID_PREFIXES.ATTENDANCE),
        employeeId,
        subsidiaryId,
        employeeName: createAttendanceRecordDto.employeeName ?? '',
        attendanceDate: createAttendanceRecordDto.attendanceDate,
        status: createAttendanceRecordDto.status,
        arrivalTime: createAttendanceRecordDto.arrivalTime ?? null,
        departureTime: createAttendanceRecordDto.departureTime ?? null,
        breakStartTime: createAttendanceRecordDto.breakStartTime ?? null,
        breakEndTime: createAttendanceRecordDto.breakEndTime ?? null,
        signature: createAttendanceRecordDto.signature ?? null,
        arrivalLatitude: createAttendanceRecordDto.arrivalLatitude ?? null,
        arrivalLongitude: createAttendanceRecordDto.arrivalLongitude ?? null,
        departureLatitude: createAttendanceRecordDto.departureLatitude ?? null,
        departureLongitude: createAttendanceRecordDto.departureLongitude ?? null,
        isGeolocationValid:
          createAttendanceRecordDto.isGeolocationValid ?? false,
        accuracyMeters: createAttendanceRecordDto.accuracyMeters ?? null,
      },
      include: {
        employee: true,
        subsidiary: true,
      },
    });
  }

  async findTodayRecord(
    employeeId: string,
    subsidiaryId: string,
  ): Promise<AttendanceRecord | null> {
    const now = new Date();
    const startOfDay = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0),
    );
    const endOfDay = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0,
        0,
        0,
        0,
      ),
    );

    return this.prisma.attendanceRecord.findFirst({
      where: {
        employeeId,
        subsidiaryId,
        attendanceDate: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });
  }

  async findByDateRange(
    employeeId: string | null,
    subsidiaryId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AttendanceRecord[]> {
    const where: any = {
      subsidiaryId,
      attendanceDate: {
        gte: startDate,
        lt: endDate,
      },
    };

    if (employeeId) {
      where.employeeId = employeeId;
    }

    return this.prisma.attendanceRecord.findMany({
      where,
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { attendanceDate: 'desc' },
    });
  }

  async findAll(subsidiaryId?: string): Promise<AttendanceRecord[]> {
    return this.prisma.attendanceRecord.findMany({
      where: subsidiaryId ? { subsidiaryId } : undefined,
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { attendanceDate: 'desc' },
    });
  }

  async findOne(id: string): Promise<AttendanceRecord> {
    const record = await this.prisma.attendanceRecord.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!record) {
      throw new NotFoundException(`Attendance record ${id} not found`);
    }

    return record;
  }

  async update(
    id: string,
    updateAttendanceRecordDto: UpdateAttendanceRecordDto,
  ): Promise<AttendanceRecord> {
    this.logger.log(`Updating attendance record ${id}`);
    await this.findOne(id);

    return this.prisma.attendanceRecord.update({
      where: { id },
      data: updateAttendanceRecordDto,
      include: { employee: true },
    });
  }

  async remove(id: string): Promise<AttendanceRecord> {
    this.logger.log(`Removing attendance record ${id}`);
    await this.findOne(id);

    return this.prisma.attendanceRecord.delete({
      where: { id },
    });
  }
}