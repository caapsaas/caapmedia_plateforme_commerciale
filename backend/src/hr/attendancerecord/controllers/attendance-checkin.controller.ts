import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Query,
  BadRequestException,
  Logger
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { AttendanceRecordService } from '../attendancerecord.service';
import { AttendanceQrDailyService } from '../services/attendance-qr-daily.service';
import { AttendanceGeolocationService } from '../services/attendance-geolocation.service';
import { CreateAttendanceRecordDto } from '../dto/atendancerecord.dto';
import { RoleGuard } from 'src/common/auth/role/role.guard';
import { Roles } from 'src/common/auth/role/role.decorator';

interface CheckInDto {
  qrToken: string;
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface CheckOutDto {
  latitude: number;
  longitude: number;
  accuracy: number;
}

@Controller('hr/attendance-checkin')
@UseGuards(JwtAuthGuard, RoleGuard)
export class AttendanceCheckInController {
  private readonly logger = new Logger(AttendanceCheckInController.name);

  constructor(
    private readonly attendanceService: AttendanceRecordService,
    private readonly qrService: AttendanceQrDailyService,
    private readonly geoService: AttendanceGeolocationService
  ) {}

  // Récupérer le QR code du jour
  @Get('daily-qr')
  async getDailyQr(@Request() req) {
    return this.qrService.getCurrentQrCode(req.user.subsidiaryId);
  }

  // Check-in avec QR Code + Géolocalisation
  @Post('check-in')
  async checkIn(@Body() dto: CheckInDto, @Request() req) {
    this.logger.log(`Check-in attempt for employee ${req.user.employeeId}`);

    // 1️⃣ Valider le QR Code
    const qrValidation = await this.qrService.validateQrToken(dto.qrToken);

    if (qrValidation.subsidiaryId !== req.user.subsidiaryId) {
      throw new BadRequestException(
        'QR code does not match your subsidiary'
      );
    }

    // 2️⃣ Valider l'accuracy GPS (rejeter si trop faible)
    if (!this.geoService.isAccuracyAcceptable(dto.accuracy)) {
      throw new BadRequestException(
        `Precision GPS insuffisante (±${Math.round(dto.accuracy)}m). Attendez d'avoir une meilleure signal.`
      );
    }

    // 3️⃣ Valider la géolocalisation
    const proximityCheck = await this.geoService.validateProximity(
      { lat: dto.latitude, lng: dto.longitude },
      req.user.subsidiaryId,
      100 // Rayon de 100m
    );

    if (!proximityCheck.isValid) {
      throw new BadRequestException(
        `Vous êtes à ${proximityCheck.distanceMeters}m du bureau. ` +
        `Approchez-vous à moins de 100m pour scanner.`
      );
    }

    // 4️⃣ Vérifier qu'il n'y a pas déjà un check-in aujourd'hui
    const todayRecord = await this.attendanceService.findTodayRecord(
      req.user.employeeId,
      req.user.subsidiaryId
    );

    if (todayRecord && todayRecord.arrivalTime) {
      throw new BadRequestException(
        'Un enregistrement d\'arrivée existe déjà pour aujourd\'hui'
      );
    }

    // 5️⃣ Vérifier si en retard
    const isLate = await this.geoService.isArrivalLate(new Date());

    // 6️⃣ Créer l'enregistrement
    const attendanceData: CreateAttendanceRecordDto = {
      employeeId: req.user.employeeId,
      attendanceDate: new Date(),
      arrivalTime: new Date(),
      status: isLate ? 'LATE' : 'PRESENT',
      employeeName: `${req.user.firstName} ${req.user.lastName}`
    };

    const result = await this.attendanceService.create(
      attendanceData,
      req.user.employeeId,
      req.user.subsidiaryId,
      {
        arrivalLatitude: dto.latitude,
        arrivalLongitude: dto.longitude,
        isGeolocationValid: proximityCheck.isValid,
        accuracyMeters: dto.accuracy,
        qrCodeToken: dto.qrToken
      }
    );

    this.logger.log(`✓ Check-in successful for employee ${req.user.employeeId}`);

    return {
      success: true,
      message: `Arrivée enregistrée à ${new Date().toLocaleTimeString('fr-FR')}`,
      status: isLate ? 'EN RETARD' : 'PRÉSENT',
      distance: `±${proximityCheck.distanceMeters}m`,
      accuracy: `±${Math.round(dto.accuracy)}m`,
      record: result
    };
  }

  // Check-out avec Géolocalisation
  @Post('check-out')
  async checkOut(@Body() dto: CheckOutDto, @Request() req) {
    this.logger.log(`Check-out attempt for employee ${req.user.employeeId}`);

    // 1️⃣ Valider l'accuracy GPS
    if (!this.geoService.isAccuracyAcceptable(dto.accuracy, 100)) {
      this.logger.warn(
        `Check-out with poor accuracy: ${Math.round(dto.accuracy)}m`
      );
    }

    // 2️⃣ Valider la géolocalisation
    const proximityCheck = await this.geoService.validateProximity(
      { lat: dto.latitude, lng: dto.longitude },
      req.user.subsidiaryId
    );

    // 3️⃣ Trouver l'enregistrement d'aujourd'hui
    const todayRecord = await this.attendanceService.findTodayRecord(
      req.user.employeeId,
      req.user.subsidiaryId
    );

    if (!todayRecord) {
      throw new BadRequestException(
        'Aucun check-in trouvé pour aujourd\'hui. Faites d\'abord un check-in.'
      );
    }

    if (todayRecord.departureTime) {
      throw new BadRequestException(
        'Un check-out a déjà été enregistré pour aujourd\'hui'
      );
    }

    // 4️⃣ Mettre à jour le départ
    const result = await this.attendanceService.update(todayRecord.id, {
      departureTime: new Date(),
      departureLatitude: dto.latitude,
      departureLongitude: dto.longitude,
      status: proximityCheck.isValid ? 'LEFT' : 'LEFT_OUTSIDE_GEOFENCE'
    });

    this.logger.log(`✓ Check-out successful for employee ${req.user.employeeId}`);

    // Calculer la durée
    const arrivalTime = new Date(result.arrivalTime!);
    const departureTime = new Date(result.departureTime!);
    const durationMs = departureTime.getTime() - arrivalTime.getTime();
    const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
    const durationMins = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    return {
      success: true,
      message: `Départ enregistré à ${departureTime.toLocaleTimeString('fr-FR')}`,
      status: proximityCheck.isValid ? 'DANS LA ZONE' : 'HORS ZONE',
      distance: `±${proximityCheck.distanceMeters}m`,
      duration: `${durationHours}h ${durationMins}min`,
      record: result
    };
  }

  // Récupérer l'historique des présences
  @Get('history')
  @Roles('HR_MANAGER', 'ADMIN')
  async getAttendanceHistory(
    @Request() req,
    @Query('year') year?: number,
    @Query('month') month?: number
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
      endDate
    );
  }

  // Récupérer les statistiques du mois
  @Get('summary')
  @Roles('HR_MANAGER', 'ADMIN')
  async getAttendanceSummary(@Request() req) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    return this.attendanceService.getMonthlyStats(
      req.user.employeeId,
      req.user.subsidiaryId,
      year,
      month
    );
  }
}
