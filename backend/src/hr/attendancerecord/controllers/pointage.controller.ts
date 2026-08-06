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
    this.logger.log(`Fetching active employees for token ${token}`);

    // Temporairement : pas de validation de token pour faciliter les tests
    // TODO: Réactiver la validation une fois le système stable
    // try {
    //   await this.dynamicTokenService.validateToken(token);
    //   this.logger.log(`Token validated successfully`);
    // } catch (error) {
    //   this.logger.error(`Token validation failed: ${error.message}`);
    //   throw error;
    // }

    // 2. Récupérer tous les employés actifs (toutes filiales)
    this.logger.log(`Querying all active employees globally`);
    const employees = await this.prisma.employee.findMany({
      where: {
        status: 'ACTIVE',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        department: true,
        positions: true,
        subsidiaryId: true,
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });

    this.logger.log(`Found ${employees.length} active employees globally`);

    return {
      success: true,
      employees,
    };
  }

  @Post()
  async pointage(@Body() dto: PointageDto) {
    this.logger.log(
      `Pointage attempt for id ${dto.matricule} with token ${dto.token}`,
    );

    // Temporairement : pas de validation de token pour faciliter les tests
    // TODO: Réactiver la validation une fois le système stable
    // try {
    //   await this.dynamicTokenService.validateToken(dto.token);
    //   this.logger.log(`Token validated successfully`);
    // } catch (error) {
    //   this.logger.error(`Token validation failed: ${error.message}`);
    //   throw error;
    // }

    // 2. Trouver l'employé par matricule (global, toutes filiales)
    this.logger.log(
      `Searching for employee with id: ${dto.matricule} globally`,
    );

    const employee = await this.prisma.employee.findFirst({
      where: {
        id: dto.matricule, // Le matricule est l'ID de l'employé
      },
    });

    if (!employee) {
      this.logger.error(`Employee not found with id: ${dto.matricule}`);
      // Log tous les employés actifs pour debug
      const allEmployees = await this.prisma.employee.findMany({
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          status: true,
          subsidiaryId: true,
        },
        take: 10,
      });
      this.logger.log(
        `Sample of active employees in database:`,
        JSON.stringify(allEmployees, null, 2),
      );
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
