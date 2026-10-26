import {
  Controller,
  Post,
  Get,
  Body,
  BadRequestException,
  Logger,
  Query,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { DynamicTokenService } from '../services/dynamic-token.service';
import { AttendanceRecordService } from '../attendancerecord.service';
import { AttendanceStatus } from '@prisma/client';

interface PointageDto {
  token: string;
  matricule: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}

interface EmployeeInfo {
  id: string;
  firstName: string;
  lastName: string;
}

@Controller('pointage')
export class PointageController {
  private readonly logger = new Logger(PointageController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dynamicTokenService: DynamicTokenService,
    private readonly attendanceService: AttendanceRecordService,
  ) {}

  @Get('employees')
  async getActiveEmployees(@Query('token') token: string) {
    if (!token) throw new BadRequestException('Token requis');
    const subsidiaryId = await this.dynamicTokenService.validateToken(token);
    const employees = await this.prisma.employee.findMany({
      where: {
        status: 'ACTIVE',
        subsidiaryId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        positions: true,
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });

    return {
      success: true,
      employees,
    };
  }

  @Post()
  async pointage(@Body() dto: PointageDto) {
    if (!dto.token || !dto.matricule) throw new BadRequestException('Token et matricule requis');
    const subsidiaryId = await this.dynamicTokenService.validateToken(dto.token);

    const employee = await this.prisma.employee.findFirst({
      where: {
        id: dto.matricule,
        subsidiaryId,
        status: 'ACTIVE',
      },
    });

    if (!employee) {
      this.logger.error(`Employee not found with id: ${dto.matricule}`);
      throw new BadRequestException('Employé non trouvé ou inactif');
    }

    if (employee.status !== 'ACTIVE') {
      this.logger.warn(
        `Employee ${employee.id} is not active, status: ${employee.status}`,
      );
      throw new BadRequestException('Employé non trouvé ou inactif');
    }

    this.logger.log(
      `Employee found: ${employee.firstName} ${employee.lastName} in subsidiary ${employee.subsidiaryId}`,
    );

    // 3. Vérifier les pointages du jour
    const todayRecord = await this.attendanceService.findTodayRecord(
      employee.id,
      employee.subsidiaryId,
    );

    const now = new Date();

    // 4. Déterminer le type de pointage
    if (!todayRecord) {
      // Aucun pointage aujourd'hui → ARRIVÉE
      const isLate = this.isLate(now);
      const status = isLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;

      const record = await this.prisma.attendanceRecord.create({
        data: {
          id: this.generateId(),
          employeeId: employee.id,
          subsidiaryId: employee.subsidiaryId,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          attendanceDate: now,
          arrivalTime: now,
          status,
          arrivalLatitude: dto.latitude,
          arrivalLongitude: dto.longitude,
          accuracyMeters: dto.accuracy,
          isGeolocationValid:
            dto.latitude !== undefined && dto.longitude !== undefined,
        },
        include: {
          employee: true,
        },
      });

      this.logger.log(
        `Arrivée enregistrée pour ${employee.firstName} ${employee.lastName}`,
      );

      return {
        success: true,
        type: 'arrival',
        message: `Arrivée enregistrée à ${now.toLocaleTimeString('fr-FR')}`,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        status: isLate ? 'EN RETARD' : 'PRÉSENT',
        record,
      };
    }

    if (todayRecord.arrivalTime && !todayRecord.departureTime) {
      // Arrivée existe mais pas de départ → DÉPART
      const updated = await this.prisma.attendanceRecord.update({
        where: { id: todayRecord.id },
        data: {
          departureTime: now,
          status: AttendanceStatus.LEFT,
          departureLatitude: dto.latitude,
          departureLongitude: dto.longitude,
          accuracyMeters: dto.accuracy,
          isGeolocationValid:
            dto.latitude !== undefined && dto.longitude !== undefined,
        },
        include: {
          employee: true,
        },
      });

      const arrivalTime = new Date(todayRecord.arrivalTime);
      const departureTime = new Date(updated.departureTime);
      const durationMs = departureTime.getTime() - arrivalTime.getTime();
      const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
      const durationMins = Math.floor(
        (durationMs % (1000 * 60 * 60)) / (1000 * 60),
      );

      this.logger.log(
        `Départ enregistré pour ${employee.firstName} ${employee.lastName}`,
      );

      return {
        success: true,
        type: 'departure',
        message: `Départ enregistré à ${departureTime.toLocaleTimeString('fr-FR')}`,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        status: 'PARTI',
        duration: `${durationHours}h ${durationMins}min`,
        record: updated,
      };
    }

    // Déjà complet
    throw new BadRequestException(
      'Vous avez déjà pointé arrivée et départ aujourd’hui',
    );
  }

  private isLate(date: Date): boolean {
    const hour = date.getHours();
    const minutes = date.getMinutes();
    // Après 08h30 → retard
    return hour > 8 || (hour === 8 && minutes > 30);
  }

  private generateId(): string {
    return `ATT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
