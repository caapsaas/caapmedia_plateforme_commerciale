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
  qrCodeToken: string;
  arrivalLatitude?: number;
  arrivalLongitude?: number;
  accuracyMeters?: number;
  isGeolocationValid?: boolean;
  signature?: string;
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
  // Création d'une présence (classique)
  // ------------------------------------------------------------------
  async create(
    createAttendanceRecordDto: CreateAttendanceRecordDto,
    employeeId: string,
    subsidiaryId: string,
  ): Promise<AttendanceRecord> {
    this.logger.log(`Creating attendance record for employee ${employeeId}`);

    // Empêche un 2e create le même jour pour le même employé
    const existingToday = await this.findTodayRecord(employeeId, subsidiaryId);
    if (existingToday) {
      throw new BadRequestException(
        "Un enregistrement de présence existe déjà pour aujourd'hui",
      );
    }

    // Empêche de réutiliser un token déjà lié à un autre enregistrement
    if (createAttendanceRecordDto.qrCodeToken) {
      const existingToken = await this.findByQrToken(
        createAttendanceRecordDto.qrCodeToken,
      );
      if (existingToken) {
        throw new BadRequestException(
          'Ce QR code a déjà été utilisé pour un pointage',
        );
      }
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
        qrCodeToken: createAttendanceRecordDto.qrCodeToken ?? null,
      },
      include: {
        employee: true,
        subsidiary: true,
      },
    });
  }

  // ------------------------------------------------------------------
  // ★ Création depuis scan QR (1er scan = ARRIVÉE)
  // ------------------------------------------------------------------
  async createFromScan(
    payload: CreateAttendanceFromScanPayload,
  ): Promise<AttendanceRecord> {
    this.logger.log(
      `createFromScan - employee ${payload.employeeId}, token ${payload.qrCodeToken}`,
    );

    // 1) Token déjà utilisé ?
    const byToken = await this.findByQrToken(payload.qrCodeToken);
    if (byToken) {
      // Si arrivée déjà faite et pas de départ → ce n'est pas un create, c'est un checkout
      if (byToken.arrivalTime && !byToken.departureTime) {
        throw new BadRequestException(
          'CHECKOUT_REQUIRED', // le controller peut intercepter et faire le départ
        );
      }
      throw new BadRequestException(
        "Ce QR code a déjà été utilisé pour un pointage complet aujourd'hui",
      );
    }

    // 2) Présence déjà existante aujourd'hui pour cet employé ?
    const existingToday = await this.findTodayRecord(
      payload.employeeId,
      payload.subsidiaryId,
    );
    if (existingToday) {
      if (existingToday.arrivalTime && !existingToday.departureTime) {
        throw new BadRequestException('CHECKOUT_REQUIRED');
      }
      throw new BadRequestException(
        "Un enregistrement complet existe déjà pour aujourd'hui",
      );
    }

    // 3) Création (1er scan)
    return this.prisma.attendanceRecord.create({
      data: {
        id: generateId(ID_PREFIXES.ATTENDANCE),
        employeeId: payload.employeeId,
        subsidiaryId: payload.subsidiaryId,
        employeeName: payload.employeeName,
        attendanceDate: payload.attendanceDate,
        arrivalTime: payload.arrivalTime,
        status: payload.status,
        qrCodeToken: payload.qrCodeToken, // unique → 1 seul enregistrement pour ce token
        signature: payload.signature ?? null,
        arrivalLatitude: payload.arrivalLatitude ?? null,
        arrivalLongitude: payload.arrivalLongitude ?? null,
        accuracyMeters: payload.accuracyMeters ?? null,
        isGeolocationValid: payload.isGeolocationValid ?? false,
      },
      include: {
        employee: true,
        subsidiary: true,
      },
    });
  }

  // ------------------------------------------------------------------
  // ★ Complétion depuis scan QR (2e scan = DÉPART)
  //    → on UPDATE le même enregistrement (même qrCodeToken)
  // ------------------------------------------------------------------
  async completeFromScan(
    payload: CompleteAttendanceFromScanPayload,
  ): Promise<AttendanceRecord> {
    this.logger.log(`completeFromScan - record ${payload.recordId}`);

    const record = await this.findOne(payload.recordId);

    if (!record.arrivalTime) {
      throw new BadRequestException(
        "Impossible de faire un départ : aucune arrivée enregistrée",
      );
    }

    if (record.departureTime) {
      throw new BadRequestException(
        "Un départ a déjà été enregistré pour cet enregistrement",
      );
    }

    return this.prisma.attendanceRecord.update({
      where: { id: payload.recordId },
      data: {
        departureTime: payload.departureTime,
        status: payload.status,
        departureLatitude: payload.departureLatitude ?? null,
        departureLongitude: payload.departureLongitude ?? null,
        accuracyMeters: payload.accuracyMeters ?? record.accuracyMeters,
        isGeolocationValid:
          payload.isGeolocationValid ?? record.isGeolocationValid,
        // ⚠️ on ne touche PAS à qrCodeToken → il reste unique et identifie la journée
      },
      include: {
        employee: true,
        subsidiary: true,
      },
    });
  }

  // ------------------------------------------------------------------
  // Trouver un enregistrement par token QR (clé unique)
  // ------------------------------------------------------------------
  async findByQrToken(qrCodeToken: string): Promise<AttendanceRecord | null> {
    return this.prisma.attendanceRecord.findFirst({
      where: { qrCodeToken },
    });
  }

  // ------------------------------------------------------------------
  // Vérifier s'il existe déjà une présence aujourd'hui
  // ------------------------------------------------------------------
  async findTodayRecord(
    employeeId: string,
    subsidiaryId: string,
  ): Promise<AttendanceRecord | null> {
    const now = new Date();

    // Plage "aujourd'hui" en UTC (adapte si tu es en timezone fixe Afrique/…)
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

    const present = records.filter(
      (r) => r.status === AttendanceStatus.PRESENT,
    ).length;
    const absent = records.filter(
      (r) => r.status === AttendanceStatus.ABSENT,
    ).length;
    const late = records.filter(
      (r) => r.status === AttendanceStatus.LATE,
    ).length;

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
  // Autres méthodes
  // ------------------------------------------------------------------
  async findAll(subsidiaryId: string): Promise<AttendanceRecord[]> {
    return this.prisma.attendanceRecord.findMany({
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