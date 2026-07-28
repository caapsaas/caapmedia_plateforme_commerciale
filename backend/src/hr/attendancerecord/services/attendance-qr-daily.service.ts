import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { v4 as uuidv4 } from 'uuid';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AttendanceQrDailyService {
  private readonly logger = new Logger(AttendanceQrDailyService.name);
  private readonly QR_SECRET =
    process.env.QR_TOKEN_SECRET || 'caap-attendance-system-secret-key-2024';
  private readonly QR_EXPIRATION = 86400; // 24 heures en secondes

  constructor(private readonly prisma: PrismaService) {}

  // Générer les QR codes quotidiens à minuit (UN PER EMPLOYEE)
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

        // Récupérer tous les employés de la filiale
        const employees = await this.prisma.employee.findMany({
          where: {
            subsidiaryId: subsidiary.id,
            status: 'ACTIVE',
          },
        });

        // Générer UN QR code par employé
        for (const employee of employees) {
          const token = this.generateQrToken(subsidiary.id, employee.id);
          const expiresAt = new Date(Date.now() + this.QR_EXPIRATION * 1000);

          // Créer l'URL du check-in
          const checkInUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/check-in?token=${token}`;

          await this.prisma.dailyQrCode.create({
            data: {
              id: uuidv4(),
              subsidiaryId: subsidiary.id,
              employeeId: employee.id,
              token,
              qrUrl: checkInUrl,
              issuedAt: new Date(),
              expiresAt,
              isActive: true,
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

  // Générer un JWT signé avec expiration (avec employeeId)
  private generateQrToken(subsidiaryId: string, employeeId: string): string {
    const payload = {
      subsidiaryId,
      employeeId,
      type: 'attendance_qr',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.QR_EXPIRATION,
    };

    return jwt.sign(payload, this.QR_SECRET, {
      algorithm: 'HS256',
      issuer: 'caap-attendance-system',
      expiresIn: this.QR_EXPIRATION,
    });
  }

  // Récupérer le QR code actif d'une filiale pour un employé spécifique
  async getCurrentQrCode(subsidiaryId: string, employeeId: string) {
    const qrCode = await this.prisma.dailyQrCode.findFirst({
      where: {
        subsidiaryId,
        employeeId,
        isActive: true,
        expiresAt: { gt: new Date() },
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
      expiresAt: qrCode.expiresAt,
      subsidiaryId: qrCode.subsidiaryId,
      employeeId: qrCode.employeeId,
      employee: qrCode.employee,
    };
  }

  // Valider un QR token (vérifie signature et expiration) + retourne employeeId
  async validateQrToken(
    token: string,
  ): Promise<{ subsidiaryId: string; employeeId: string }> {
    try {
      const decoded = jwt.verify(token, this.QR_SECRET) as any;

      // Vérifier que le token existe en DB et est actif
      const qrCode = await this.prisma.dailyQrCode.findUnique({
        where: { token },
      });

      if (!qrCode || !qrCode.isActive) {
        throw new UnauthorizedException('QR code has been invalidated');
      }

      if (new Date() > qrCode.expiresAt) {
        throw new UnauthorizedException('QR code has expired');
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

  // Invalider manuellement un QR code (pour raison de sécurité)
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

  // Récupérer tous les QR codes actifs des employés d'une filiale
  async getAllQrCodesForSubsidiary(subsidiaryId: string) {
    const qrCodes = await this.prisma.dailyQrCode.findMany({
      where: {
        subsidiaryId,
        isActive: true,
        expiresAt: { gt: new Date() },
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

    return qrCodes.map((qr) => ({
      token: qr.token,
      issuedAt: qr.issuedAt,
      expiresAt: qr.expiresAt,
      subsidiaryId: qr.subsidiaryId,
      employeeId: qr.employeeId,
      employee: qr.employee,
    }));
  }
}
