import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Query,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { AttendanceRecordService } from '../attendancerecord.service';
import { AttendanceQrDailyService } from '../services/attendance-qr-daily.service';
import { AttendanceGeolocationService } from '../services/attendance-geolocation.service';
import { CreateAttendanceRecordDto } from '../dto/atendancerecord.dto';
import { RoleGuard } from 'src/common/auth/role/role.guard';
import { Roles } from 'src/common/auth/role/role.decorator';
import { AttendanceStatus } from '@prisma/client';

interface CheckInDto {
  qrToken: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  signature?: string;
}

interface CheckOutDto {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}

@Controller('hr/attendance-checkin')
export class AttendanceCheckInController {
  private readonly logger = new Logger(AttendanceCheckInController.name);

  constructor(
    private readonly attendanceService: AttendanceRecordService,
    private readonly qrService: AttendanceQrDailyService,
    private readonly geoService: AttendanceGeolocationService,
  ) {}

  // ------------------------------------------------------------------
  // Récupérer le QR code du jour (employé connecté)
  // ------------------------------------------------------------------
  @Get('daily-qr')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async getDailyQr(@Request() req) {
    this.logger.log(
      `📍 getDailyQr - employeeId: ${req.user.employeeId}, userId: ${req.user.id}`,
    );

    const result = await this.qrService.getCurrentQrCode(
      req.user.subsidiaryId,
      req.user.employeeId || req.user.id,
    );

    return result;
  }

  // ------------------------------------------------------------------
  // Récupérer tous les QR codes de la filiale (HR / Admin)
  // ------------------------------------------------------------------
  @Get('daily-qr-all')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('HR_MANAGER', 'ADMIN', 'SUPER_ADMIN')
  async getAllDailyQr(@Request() req) {
    const isSuperAdmin = req.user.roles?.includes('SUPER_ADMIN');
    const subsidiaryId = isSuperAdmin ? null : req.user.subsidiaryId;

    const result = await this.qrService.getAllQrCodesForSubsidiary(subsidiaryId);
    return result;
  }

  // ------------------------------------------------------------------
  // ★ Check-in / Check-out via scan QR (pas besoin de JWT)
  // ------------------------------------------------------------------
  @Post('check-in')
  async checkIn(@Body() dto: CheckInDto) {
    // 1. Valider le QR token
    const { employeeId, subsidiaryId } = await this.qrService.validateQrToken(
      dto.qrToken,
    );

    this.logger.log(`Check-in/check-out attempt for employee ${employeeId}`);

    // 2. Chercher s’il existe déjà un enregistrement aujourd’hui
    const todayRecord = await this.attendanceService.findTodayRecord(
      employeeId,
      subsidiaryId,
    );

    // ========== CAS 1 : Aucun enregistrement → CHECK-IN ==========
    if (!todayRecord) {
      const isLate = await this.geoService.isArrivalLate(new Date());

      const employee = await this.attendanceService.findEmployeeById(employeeId);
      if (!employee) {
        throw new BadRequestException('Employé non trouvé');
      }

      const attendanceData: CreateAttendanceRecordDto = {
        employeeName: `${employee.firstName} ${employee.lastName}`,
        attendanceDate: new Date(),
        arrivalTime: new Date(),
        status: isLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT,
        signature: dto.signature,
        arrivalLatitude: dto.latitude,
        arrivalLongitude: dto.longitude,
        accuracyMeters: dto.accuracy,
        isGeolocationValid: dto.latitude !== undefined && dto.longitude !== undefined,
        qrCodeToken: dto.qrToken,
      };

      const result = await this.attendanceService.create(
        attendanceData,
        employeeId,
        subsidiaryId,
      );

      this.logger.log(`✓ Check-in created for employee ${employeeId}`);

      return {
        success: true,
        type: 'check-in',
        message: `Arrivée enregistrée à ${new Date().toLocaleTimeString('fr-FR')}`,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        status: isLate ? 'EN RETARD' : 'PRÉSENT',
        record: result,
      };
    }

    // ========== CAS 2 : Arrivée existe, pas encore de départ → CHECK-OUT ==========
    if (todayRecord.arrivalTime && !todayRecord.departureTime) {
      const updatePayload: any = {
        departureTime: new Date(),
        status: 'LEFT', // ou AttendanceStatus.LEFT si vous l’avez dans l’enum
      };

      if (dto.latitude !== undefined) updatePayload.departureLatitude = dto.latitude;
      if (dto.longitude !== undefined) updatePayload.departureLongitude = dto.longitude;
      if (dto.accuracy !== undefined) updatePayload.accuracyMeters = dto.accuracy;

      const updated = await this.attendanceService.update(
        todayRecord.id,
        updatePayload,
      );

      this.logger.log(`✓ Check-out created for employee ${employeeId}`);

      const arrivalTime = new Date(updated.arrivalTime!);
      const departureTime = new Date(updated.departureTime!);
      const durationMs = departureTime.getTime() - arrivalTime.getTime();
      const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
      const durationMins = Math.floor(
        (durationMs % (1000 * 60 * 60)) / (1000 * 60),
      );

      return {
        success: true,
        type: 'check-out',
        message: `Départ enregistré à ${departureTime.toLocaleTimeString('fr-FR')}`,
        status: 'PARTI',
        duration: `${durationHours}h ${durationMins}min`,
        record: updated,
      };
    }

    // ========== CAS 3 : Déjà check-in + check-out ==========
    throw new BadRequestException(
      "Un enregistrement complet (arrivée + départ) existe déjà pour aujourd'hui",
    );
  }

  // ------------------------------------------------------------------
  // Check-out manuel (authentifié)
  // ------------------------------------------------------------------
  @Post('check-out')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async checkOut(@Body() dto: CheckOutDto, @Request() req) {
    const employeeId = req.user.employeeId || req.user.id;
    const subsidiaryId = req.user.subsidiaryId;

    this.logger.log(`Check-out attempt for employee ${employeeId}`);

    const todayRecord = await this.attendanceService.findTodayRecord(
      employeeId,
      subsidiaryId,
    );

    if (!todayRecord) {
      throw new BadRequestException(
        "Aucun check-in trouvé pour aujourd'hui. Faites d'abord un check-in.",
      );
    }

    if (todayRecord.departureTime) {
      throw new BadRequestException(
        "Un check-out a déjà été enregistré pour aujourd'hui",
      );
    }

    const result = await this.attendanceService.update(todayRecord.id, {
      departureTime: new Date(),
      departureLatitude: dto.latitude,
      departureLongitude: dto.longitude,
      status: 'LEFT',
    });

    const arrivalTime = new Date(result.arrivalTime!);
    const departureTime = new Date(result.departureTime!);
    const durationMs = departureTime.getTime() - arrivalTime.getTime();
    const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
    const durationMins = Math.floor(
      (durationMs % (1000 * 60 * 60)) / (1000 * 60),
    );

    return {
      success: true,
      message: `Départ enregistré à ${departureTime.toLocaleTimeString('fr-FR')}`,
      status: 'PARTI',
      duration: `${durationHours}h ${durationMins}min`,
      record: result,
    };
  }

  // ------------------------------------------------------------------
  // Historique personnel
  // ------------------------------------------------------------------
  @Get('history')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async getAttendanceHistory(
    @Request() req,
    @Query('year') year?: number,
    @Query('month') month?: number,
  ) {
    const now = new Date();
    const queryYear = year || now.getFullYear();
    const queryMonth = month || now.getMonth() + 1;

    const startDate = new Date(queryYear, queryMonth - 1, 1);
    const endDate = new Date(queryYear, queryMonth, 1);

    return this.attendanceService.findByDateRange(
      req.user.employeeId || req.user.id,
      req.user.subsidiaryId,
      startDate,
      endDate,
    );
  }

  // ------------------------------------------------------------------
  // Historique de toute la filiale (uniquement les scans QR)
  // ------------------------------------------------------------------
    @Get('history-all')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles('HR_MANAGER', 'ADMIN', 'SUPER_ADMIN')
    async getAllAttendanceHistory(
      @Request() req,
      @Query('year') year?: number,
      @Query('month') month?: number,
    ) {
      const now = new Date();
      const queryYear = year ? Number(year) : now.getFullYear();
      const queryMonth = month ? Number(month) : now.getMonth() + 1;

      const startDate = new Date(queryYear, queryMonth - 1, 1);
      const endDate = new Date(queryYear, queryMonth, 1);

      this.logger.log(
        `history-all → subsidiaryId=${req.user.subsidiaryId}, ` +
        `from=${startDate.toISOString()}, to=${endDate.toISOString()}`,
      );

      // false = toutes les présences (sans filtre qrCodeToken)
      return this.attendanceService.findByDateRange(
        null,
        req.user.subsidiaryId,
        startDate,
        endDate,
        false,
      );
    }

  // ------------------------------------------------------------------
  // Statistiques du mois
  // ------------------------------------------------------------------
  @Get('summary')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async getAttendanceSummary(@Request() req) {
    const now = new Date();
    return this.attendanceService.getMonthlyStats(
      req.user.employeeId || req.user.id,
      req.user.subsidiaryId,
      now.getFullYear(),
      now.getMonth() + 1,
    );
  }
}