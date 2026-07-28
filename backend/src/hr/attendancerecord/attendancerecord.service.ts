import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import {
  CreateAttendanceRecordDto,
  UpdateAttendanceRecordDto,
} from './dto/atendancerecord.dto';
import { AttendanceRecord } from '@prisma/client';
import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';

export interface CreateAttendanceWithGeoDto extends CreateAttendanceRecordDto {
  arrivalLatitude?: number;
  arrivalLongitude?: number;
  departureLatitude?: number;
  departureLongitude?: number;
  isGeolocationValid?: boolean;
  accuracyMeters?: number;
  qrCodeToken?: string;
}

@Injectable()
export class AttendanceRecordService {
  private readonly logger = new Logger(AttendanceRecordService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    createAttendanceRecordDto: CreateAttendanceRecordDto,
    employeeId: string,
    subsidiaryId: string,
    geoData?: {
      arrivalLatitude?: number;
      arrivalLongitude?: number;
      departureLatitude?: number;
      departureLongitude?: number;
      isGeolocationValid?: boolean;
      accuracyMeters?: number;
      qrCodeToken?: string;
    },
  ): Promise<AttendanceRecord> {
    this.logger.log(`Creating attendance record for employee ${employeeId}`);
    return this.prisma.attendanceRecord.create({
      data: {
        id: generateId(ID_PREFIXES.ATTENDANCE),
        employeeName: createAttendanceRecordDto.employeeName ?? '',
        attendanceDate: createAttendanceRecordDto.attendanceDate,
        status: createAttendanceRecordDto.status,
        arrivalTime: createAttendanceRecordDto.arrivalTime,
        departureTime: createAttendanceRecordDto.departureTime,
        breakStartTime: createAttendanceRecordDto.breakStartTime,
        breakEndTime: createAttendanceRecordDto.breakEndTime,
        signature: createAttendanceRecordDto.signature,
        employeeId,
        subsidiaryId,
        // Geolocation data
        arrivalLatitude: geoData?.arrivalLatitude,
        arrivalLongitude: geoData?.arrivalLongitude,
        departureLatitude: geoData?.departureLatitude,
        departureLongitude: geoData?.departureLongitude,
        isGeolocationValid: geoData?.isGeolocationValid ?? false,
        accuracyMeters: geoData?.accuracyMeters,
        qrCodeToken: geoData?.qrCodeToken,
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.attendanceRecord.findFirst({
      where: {
        employeeId,
        subsidiaryId,
        attendanceDate: { gte: today, lt: tomorrow },
      },
    });
  }

  async findEmployeeById(employeeId: string) {
    return this.prisma.employee.findUnique({ where: { id: employeeId } });
  }

  async findByDateRange(
    employeeId: string | null,
    subsidiaryId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AttendanceRecord[]> {
    const where: any = {
      subsidiaryId,
      attendanceDate: { gte: startDate, lt: endDate },
    };
    if (employeeId) {
      where.employeeId = employeeId;
    }
    return this.prisma.attendanceRecord.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { attendanceDate: 'desc' },
    });
  }

  async getMonthlyStats(
    employeeId: string,
    subsidiaryId: string,
    year: number,
    month: number,
  ) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const records = await this.findByDateRange(
      employeeId,
      subsidiaryId,
      startDate,
      endDate,
    );

    const present = records.filter((r) => r.status === 'PRESENT').length;
    const absent = records.filter((r) => r.status === 'ABSENT').length;
    const late = records.filter((r) => r.status === 'LATE').length;

    return { year, month, present, absent, late, total: records.length };
  }

  async findAll(subsidiaryId: string): Promise<AttendanceRecord[]> {
    return this.prisma.attendanceRecord.findMany({
      where: { subsidiaryId },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { attendanceDate: 'desc' },
    });
  }

  async findOne(id: string): Promise<AttendanceRecord> {
    const record = await this.prisma.attendanceRecord.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!record)
      throw new NotFoundException(`Attendance record ${id} not found`);
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
    return this.prisma.attendanceRecord.delete({ where: { id } });
  }
}
