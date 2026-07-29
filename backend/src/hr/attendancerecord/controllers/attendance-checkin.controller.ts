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
import { RoleGuard } from 'src/common/auth/role/role.guard';
import { Roles } from 'src/common/auth/role/role.decorator';

// Note: latitude/longitude/accuracy are accepted for backward compatibility
// but are OPTIONAL and will not be used to validate or block check-in/check-out.
interface CheckInDto {
  qrToken: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
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

  // Récupérer le QR code du jour (protégé par JWT)
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
    this.logger.log(`✅ QR Code Response: ${JSON.stringify(result)}`);
    return result;
  }

  // Récupérer les QR codes de tous les employés de la filiale (protégé par JWT)
  @Get('daily-qr-all')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('HR_MANAGER', 'ADMIN')
  async getAllDailyQr(@Request() req) {
    this.logger.log(
      `📍 getAllDailyQr - subsidiaryId: ${req.user.subsidiaryId}`,
    );
    // SUPER_ADMIN : passe null pour récupérer les QR de TOUTES les filiales
    const isSuperAdmin = req.user.roles?.includes('SUPER_ADMIN');
    const subsidiaryId = isSuperAdmin ? null : req.user.subsidiaryId;
    const result = await this.qrService.getAllQrCodesForSubsidiary(subsidiaryId);
    this.logger.log(`✅ All QR Codes Response: ${result.length} codes`);
    return result;
  }

  // Check-in endpoint that supports both arrival and departure when called by scanning the QR.
  // Behavior:
  // - If there is no record for today -> create arrival (check-in)
  // - If there is a record with arrival but no departure -> update departure (check-out)
  // - If there is already arrival+departure -> reject
  // This endpoint does not require JWT because the QR token encodes employee/subsidiary info.
  @Post('check-in')
  async checkIn(@Body() dto: CheckInDto) {
    // 1️⃣ Valider le QR Code (contient déjà l'employeeId et subsidiaryId)
    const qrValidation = await this.qrService.validateQrToken(dto.qrToken);
    const employeeId = qrValidation.employeeId;
    const subsidiaryId = qrValidation.subsidiaryId;

    this.logger.log(`Check-in/check-out attempt for employee ${employeeId}`);

    // 2️⃣ Rechercher l'enregistrement d'aujourd'hui
    const todayRecord = await this.attendanceService.findTodayRecord(
      employeeId,
      subsidiaryId,
    );

    // If no record -> create arrival
    if (!todayRecord) {
      // Vérifier si en retard (basé uniquement sur l'heure)
      const isLate = await this.geoService.isArrivalLate(new Date());

      // Récupérer les infos de l'employé
      const employee = await this.attendanceService.findEmployeeById(employeeId);
      if (!employee) {
        throw new BadRequestException('Employé non trouvé');
      }

      const scanTime = new Date();
      const attendanceData = {
        employeeId,
        subsidiaryId,
        attendanceDate: scanTime,
        arrivalTime: scanTime,
        status: isLate ? 'LATE' : 'PRESENT',
        employeeName: `${employee.firstName} ${employee.lastName}`,
        qrCodeToken: dto.qrToken,
        arrivalLatitude: dto.latitude,
        arrivalLongitude: dto.longitude,
        accuracyMeters: dto.accuracy,
        isGeolocationValid: false,
      };

      const result = await this.attendanceService.createFromScan(attendanceData);

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

    // If record exists and has arrival but no departure -> perform check-out
    if (todayRecord.arrivalTime && !todayRecord.departureTime) {
      const updated = await this.attendanceService.completeFromScan({
        recordId: todayRecord.id,
        departureTime: new Date(),
        status: 'LEFT',
        departureLatitude: dto.latitude,
        departureLongitude: dto.longitude,
        accuracyMeters: dto.accuracy,
        isGeolocationValid: false,
      });

      this.logger.log(`✓ Check-out created for employee ${employeeId}`);

      const arrivalTime = new Date(updated.arrivalTime);
      const departureTime = new Date(updated.departureTime);
      const durationMs = departureTime.getTime() - arrivalTime.getTime();
      const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
      const durationMins = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

      return {
        success: true,
        type: 'check-out',
        message: `Départ enregistré à ${departureTime.toLocaleTimeString('fr-FR')}`,
        status: 'PARTI',
        duration: `${durationHours}h ${durationMins}min`,
        record: updated,
      };
    }

    // If arrival and departure already present -> reject
    throw new BadRequestException('Un enregistrement complet existe déjà pour aujourd\'hui');
  }

  // Keep the existing check-out endpoint for authenticated manual check-outs if needed
  @Post('check-out')
  @UseGuards(JwtAuthGuard, RoleGuard)
  async checkOut(@Body() dto: CheckOutDto, @Request() req) {
    this.logger.log(`Check-out attempt for employee ${req.user.employeeId}`);

    // 1️⃣ Trouver l'enregistrement d'aujourd'hui
    const todayRecord = await this.attendanceService.findTodayRecord(
      req.user.employeeId,
      req.user.subsidiaryId,
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

    // 2️⃣ Mettre à jour le départ — ne pas utiliser la géolocalisation pour déterminer le statut
    const result = await this.attendanceService.completeFromScan({
      recordId: todayRecord.id,
      departureTime: new Date(),
      departureLatitude: dto.latitude,
      departureLongitude: dto.longitude,
      status: 'LEFT',
      isGeolocationValid: false,
    });

    this.logger.log(
      `✓ Check-out successful for employee ${req.user.employeeId}`,
    );

    // Calculer la durée
    const arrivalTime = new Date(result.arrivalTime);
    const departureTime = new Date(result.departureTime);
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

  // Récupérer l'historique des présences (protégé par JWT)
  @Get('history')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('HR_MANAGER', 'ADMIN')
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
      req.user.employeeId,
      req.user.subsidiaryId,
      startDate,
      endDate,
    );
  }

  // Récupérer les statistiques du mois (protégé par JWT)
  @Get('summary')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('HR_MANAGER', 'ADMIN')
  async getAttendanceSummary(@Request() req) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    return this.attendanceService.getMonthlyStats(
      req.user.employeeId,
      req.user.subsidiaryId,
      year,
      month,
    );
  }
}
