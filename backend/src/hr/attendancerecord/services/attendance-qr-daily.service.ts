import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { AttendanceRecordService } from '../attendancerecord.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { v4 as uuidv4 } from 'uuid';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AttendanceQrDailyService {
  private readonly logger = new Logger(AttendanceQrDailyService.name);
  private readonly QR_SECRET =
    process.env.QR_TOKEN_SECRET || 'caap-attendance-system-secret-key-2024';

  constructor(
    private readonly prisma: PrismaService,
    private readonly attendanceService: AttendanceRecordService,
  ) {}

  // ------------------------------------------------------------------
  // Génération quotidienne des QR codes (1 par employé) - SANS expiration
  // ------------------------------------------------------------------
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async generateDailyQrCodes() {
    this.logger.log('🔄 Generating daily QR codes for all employees');

    try {
      const subsidiaries = await this.prisma.subsidiary.findMany();

      for (const subsidiary of subsidiaries) {
        // Invalider les anciens QR codes actifs
        await this.prisma.dailyQrCode.updateMany({
          where: {
            subsidiaryId: subsidiary.id,
            isActive: true,
          },
          data: {
            isActive: false,
          },
        });

        // Récupérer tous les employés actifs de la filiale
        const employees = await this.prisma.employee.findMany({
          where: {
            subsidiaryId: subsidiary.id,
            status: 'ACTIVE',
          },
        });

        // Générer UN QR code par employé
        for (const employee of employees) {
          const token = this.generateQrToken(subsidiary.id, employee.id);

          const checkInUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/check-in?token=${token}`;

          await this.prisma.dailyQrCode.create({
            data: {
              id: uuidv4(),
              subsidiaryId: subsidiary.id,
              employeeId: employee.id,
              token,
              qrUrl: checkInUrl,
              issuedAt: new Date(),
              isActive: true,
              // expiresAt a été retiré
            },
          });

          this.logger.debug(
            `✓ QR code generated for ${employee.firstName} ${employee.lastName}`,
          );
        }

        this.logger.debug(
          `✓ Generated ${employees.length} QR codes for ${subsidiary.subsidiaryName}`,
        );
      }

      this.logger.log('✓ Daily QR code generation completed successfully');
    } catch (error) {
      this.logger.error(
        `Error generating daily QR codes: ${error.message}`,
        error.stack,
      );
    }
  }

  // ------------------------------------------------------------------
  // Génération du JWT (SANS expiration)
  // ------------------------------------------------------------------
  private generateQrToken(subsidiaryId: string, employeeId: string): string {
    const payload = {
      subsidiaryId,
      employeeId,
      type: 'attendance_qr',
      iat: Math.floor(Date.now() / 1000),
      // plus de champ "exp"
    };

    return jwt.sign(payload, this.QR_SECRET, {
      algorithm: 'HS256',
      issuer: 'caap-attendance-system',
      // plus d'expiresIn
    });
  }

  // ------------------------------------------------------------------
  // Récupérer le QR code actif d'un employé
  // ------------------------------------------------------------------
  async getCurrentQrCode(subsidiaryId: string, employeeId: string) {
    const qrCode = await this.prisma.dailyQrCode.findFirst({
      where: {
        subsidiaryId,
        employeeId,
        isActive: true,
      },
      orderBy: { issuedAt: 'desc' },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: true,
            positions: true,
          },
        },
      },
    });

    if (!qrCode) {
      throw new NotFoundException('No active QR code for this employee');
    }

    return {
      token: qrCode.token,
      issuedAt: qrCode.issuedAt,
      subsidiaryId: qrCode.subsidiaryId,
      employeeId: qrCode.employeeId,
      employee: qrCode.employee,
    };
  }

  // ------------------------------------------------------------------
  // Validation pure du token (SANS vérification d'expiration)
  // ------------------------------------------------------------------
  async validateQrToken(
    token: string,
  ): Promise<{ subsidiaryId: string; employeeId: string }> {
    try {
      const decoded = jwt.verify(token, this.QR_SECRET) as any;

      const qrCode = await this.prisma.dailyQrCode.findUnique({
        where: { token },
      });

      if (!qrCode || !qrCode.isActive) {
        throw new UnauthorizedException('QR code has been invalidated');
      }

      return {
        subsidiaryId: decoded.subsidiaryId,
        employeeId: decoded.employeeId,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid or malformed QR code token');
    }
  }

  // ------------------------------------------------------------------
  // ★ MÉTHODE PRINCIPALE : Scan QR → création automatique de présence
  // ------------------------------------------------------------------
  async processCheckIn(
    token: string,
    options?: {
      signature?: string;
      arrivalLatitude?: number;
      arrivalLongitude?: number;
      accuracyMeters?: number;
      isGeolocationValid?: boolean;
    },
  ) {
    // 1. Valider le token
    const { subsidiaryId, employeeId } = await this.validateQrToken(token);

    // 2. Vérifier qu'il n'existe pas déjà une présence aujourd'hui
    const existing = await this.attendanceService.findTodayRecord(
      employeeId,
      subsidiaryId,
    );
    if (existing) {
      throw new BadRequestException(
        "Une présence a déjà été enregistrée aujourd'hui pour cet employé",
      );
    }

    // 3. Récupérer l'employé
    const employee = await this.attendanceService.findEmployeeById(employeeId);
    if (!employee) {
      throw new NotFoundException('Employé introuvable');
    }

    // 4. Déterminer le statut (PRESENT / LATE)
    const now = new Date();
    const status = this.determineAttendanceStatus(now);

    // 5. Créer la présence
    //    → employeeId et subsidiaryId sont passés séparément
    //      (comme dans la signature originale de AttendanceRecordService.create)
    const record = await this.attendanceService.create(
      {
        employeeName: `${employee.firstName} ${employee.lastName}`,
        attendanceDate: now,
        status,
        arrivalTime: now,
        signature: options?.signature ?? null,
        arrivalLatitude: options?.arrivalLatitude ?? null,
        arrivalLongitude: options?.arrivalLongitude ?? null,
        accuracyMeters: options?.accuracyMeters ?? null,
        isGeolocationValid: options?.isGeolocationValid ?? false,
        qrCodeToken: token,
      },
      employeeId,
      subsidiaryId,
    );

    this.logger.log(
      `✓ Présence créée via QR pour ${employee.firstName} ${employee.lastName} (${status})`,
    );

    return record;
  }

  /**
   * Logique de détermination du statut.
   * À adapter selon vos règles métier.
   */
  private determineAttendanceStatus(now: Date): 'PRESENT' | 'LATE' {
    const hour = now.getHours();
    const minutes = now.getMinutes();

    // Exemple : après 08h30 → LATE
    if (hour > 8 || (hour === 8 && minutes > 30)) {
      return 'LATE';
    }
    return 'PRESENT';
  }

  // ------------------------------------------------------------------
  // Invalidation manuelle
  // ------------------------------------------------------------------
  async invalidateQrCode(subsidiaryId: string) {
    return this.prisma.dailyQrCode.updateMany({
      where: {
        subsidiaryId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });
  }

  // ------------------------------------------------------------------
  // Récupérer tous les QR codes d'une filiale (+ génération à la volée)
  // ------------------------------------------------------------------
  async getAllQrCodesForSubsidiary(subsidiaryId: string | null) {
    const employeeWhere: any = { status: 'ACTIVE' };
    if (subsidiaryId) employeeWhere.subsidiaryId = subsidiaryId;

    const employees = await this.prisma.employee.findMany({
      where: employeeWhere,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        department: true,
        positions: true,
        subsidiaryId: true,
      },
    });

    const qrWhere: any = { isActive: true };
    if (subsidiaryId) qrWhere.subsidiaryId = subsidiaryId;

    const existingQrCodes = await this.prisma.dailyQrCode.findMany({
      where: qrWhere,
    });

    const qrCodesByEmployeeId = new Map(
      existingQrCodes.map((qr) => [qr.employeeId, qr]),
    );
    const results = [];

    for (const employee of employees) {
      let qrCode = qrCodesByEmployeeId.get(employee.id);

      if (!qrCode) {
        const token = this.generateQrToken(employee.subsidiaryId, employee.id);
        const checkInUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/check-in?token=${token}`;

        qrCode = await this.prisma.dailyQrCode.create({
          data: {
            id: uuidv4(),
            subsidiaryId: employee.subsidiaryId,
            employeeId: employee.id,
            token,
            qrUrl: checkInUrl,
            issuedAt: new Date(),
            isActive: true,
          },
        });

        this.logger.debug(
          `QR code généré à la volée pour ${employee.firstName} ${employee.lastName}`,
        );
      }

      results.push({
        token: qrCode.token,
        issuedAt: qrCode.issuedAt,
        subsidiaryId: qrCode.subsidiaryId,
        employeeId: qrCode.employeeId,
        employee: employee,
      });
    }

    return results;
  }
}
