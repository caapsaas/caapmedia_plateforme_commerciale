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

  // Check-in avec QR Code (géolocalisation désormais facultative et non utilisée)
  @Post('check-in')
  async checkIn(@Body() dto: CheckInDto) {
    // 1️⃣ Valider le QR Code (contient déjà l'employeeId et subsidiaryId)
    const qrValidation = await this.qrService.validateQrToken(dto.qrToken);
    const employeeId = qrValidation.employeeId;
    const subsidiaryId = qrValidation.subsidiaryId;

    this.logger.log(`Check-in attempt for employee ${employeeId}`);

    // NOTE: We no longer reject based on GPS accuracy or proximity. Any latitude/longitude
    // provided are stored only for informational/audit purposes by the service layer.

    // 2️⃣ Vérifier qu'il n'y a pas déjà un check-in aujourd'hui
    const todayRecord = await this.attendanceService.findTodayRecord(
      employeeId,
      subsidiaryId,
    );

    if (todayRecord && todayRecord.arrivalTime) {
      throw new BadRequestException(
        "Un enregistrement d'arrivée existe déjà pour aujourd'hui",
      );
    }

    // 3️⃣ Vérifier si en retard (basé uniquement sur l'heure)
    const isLate = await this.geoService.isArrivalLate(new Date());

    // 4️⃣ Récupérer les infos de l'employé
    const employee = await this.attendanceService.findEmployeeById(employeeId);
    if (!employee) {
      throw new BadRequestException('Employé non trouvé');
    }

    // 5️⃣ Créer l'enregistrement (ne pas utiliser la géolocalisation pour décider du statut)
    const attendanceData: CreateAttendanceRecordDto = {
      employeeId,
      attendanceDate: new Date(),
      arrivalTime: new Date(),
      status: isLate ? 'LATE' : 'PRESENT',
      employeeName: `${employee.firstName} ${employee.lastName}`,
      // If geo fields are present in DTO model, the service will persist them as informational only.
    };

    const result = await this.attendanceService.create(
      attendanceData,
      employeeId,
      subsidiaryId,
    );

    this.logger.log(`✓ Check-in successful for employee ${employeeId}`);

    return {
      success: true,
      message: `Arrivée enregistrée à ${new Date().toLocaleTimeString('fr-FR')}`,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      status: isLate ? 'EN RETARD' : 'PRÉSENT',
      record: result,
    };
  }

  // Check-out (protégé par JWT) — géolocalisation facultative et non utilisée pour valider
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
    const result = await this.attendanceService.update(todayRecord.id, {
      departureTime: new Date(),
      status: 'LEFT',
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
