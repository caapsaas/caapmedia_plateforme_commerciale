import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import {
  CreateAttendanceRecordDto,
  UpdateAttendanceRecordDto,
} from './dto/atendancerecord.dto';
import { AttendanceRecord, AttendanceStatus } from '@prisma/client';
import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';

interface CreateAttendanceFromScanPayload {
  employeeId: string;
  subsidiaryId: string;
  employeeName: string;
  attendanceDate: Date;
  arrivalTime: Date;
  status: AttendanceStatus;
  qrCodeToken?: string;
  arrivalLatitude?: number;
  arrivalLongitude?: number;
  accuracyMeters?: number;
  isGeolocationValid?: boolean;
}

interface CompleteAttendanceFromScanPayload {
  recordId: string;
  departureTime: Date;
  status: AttendanceStatus;
  departureLatitude?: number;
  departureLongitude?: number;
  accuracyMeters?: number;
  isGeolocationValid?: boolean;
}

@Injectable()
export class AttendanceRecordService {
  private readonly logger = new Logger(AttendanceRecordService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ------------------------------------------------------------------
  // Création d'une présence
  // ------------------------------------------------------------------
  async create(
    createAttendanceRecordDto: CreateAttendanceRecordDto,
    employeeId: string,
    subsidiaryId: string,
  ): Promise<AttendanceRecord> {
    this.logger.log(`Creating attendance record for employee ${employeeId}`);

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

        // Géolocalisation (informatif uniquement)
        arrivalLatitude: createAttendanceRecordDto.arrivalLatitude ?? null,
        arrivalLongitude: createAttendanceRecordDto.arrivalLongitude ?? null,
        departureLatitude: createAttendanceRecordDto.departureLatitude ?? null,
        departureLongitude: createAttendanceRecordDto.departureLongitude ?? null,
        isGeolocationValid:
          createAttendanceRecordDto.isGeolocationValid ?? false,
        accuracyMeters: createAttendanceRecordDto.accuracyMeters ?? null,

        // Token QR (important pour le filtre qrOnly)
        qrCodeToken: createAttendanceRecordDto.qrCodeToken ?? null,
      },
      include: {
        employee: true,
        subsidiary: true,
      },
    });
  }

  // ------------------------------------------------------------------
  // Vérifier s'il existe déjà une présence aujourd'hui
  // ------------------------------------------------------------------
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
        attendanceDate: {
          gte: today,
          lt: tomorrow,
        },
      },
    });
  }

  // ------------------------------------------------------------------
  // Récupérer un employé
  // ------------------------------------------------------------------
  async findEmployeeById(employeeId: string) {
    return this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
  }

  // ------------------------------------------------------------------
  // Recherche par plage de dates
  // ------------------------------------------------------------------
  async findByDateRange(
    employeeId: string | null,
    subsidiaryId: string,
    startDate: Date,
    endDate: Date,
    qrOnly: boolean = false,
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

    if (qrOnly) {
      where.qrCodeToken = { not: null };
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

  // ------------------------------------------------------------------
  // Statistiques mensuelles
  // ------------------------------------------------------------------
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

    const present = records.filter((r) => r.status === AttendanceStatus.PRESENT).length;
    const absent = records.filter((r) => r.status === AttendanceStatus.ABSENT).length;
    const late = records.filter((r) => r.status === AttendanceStatus.LATE).length;

    return {
      year,
      month,
      present,
      absent,
      late,
      total: records.length,
    };
  }

  // ------------------------------------------------------------------
  // Autres méthodes (inchangées)
  // ------------------------------------------------------------------
  async findAll(subsidiaryId: string): Promise<AttendanceRecord[]> {
    return this.prisma.attendanceRecord.findMany({
      //where: { subsidiaryId },
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