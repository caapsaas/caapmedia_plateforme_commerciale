import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AttendanceStatus } from '@prisma/client';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { DynamicTokenService } from './dynamic-token.service';
import { attendanceDayBounds } from './attendance-day';
import { SecurePointageDto } from '../dto/secure-pointage.dto';

@Injectable()
export class AttendanceSecurityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: DynamicTokenService,
  ) {}

  async pointage(dto: SecurePointageDto) {
    const result = await this.prisma.$transaction(
      async (tx) => {
        const subsidiaryId = await this.tokens.validateToken(dto.token, tx);
        // Serializes both attempts and attendance transitions, including replays.
        await tx.$queryRaw`SELECT id FROM employees WHERE id = ${dto.matricule} FOR UPDATE`;
        const employee = await tx.employee.findFirst({
          where: { id: dto.matricule, subsidiaryId, status: 'ACTIVE' },
          select: { id: true, firstName: true, lastName: true },
        });
        if (!employee)
          throw new NotFoundException('Employé non trouvé ou inactif.');
        const now = new Date();
        await this.tokens.validateToken(dto.token, tx);
        const day = attendanceDayBounds(now);
        const today = await tx.attendanceRecord.findFirst({
          where: {
            employeeId: employee.id,
            subsidiaryId,
            attendanceDate: { gte: day.start, lt: day.end },
          },
        });
        const employeeName = `${employee.firstName} ${employee.lastName}`;
        if (dto.action === 'arrival') {
          if (today)
            throw new BadRequestException({
              code: 'ALREADY_CHECKED_IN',
              message: 'Une arrivée est déjà enregistrée aujourd’hui.',
            });
          await tx.attendanceRecord.create({
            data: {
              id: `ATT-${randomUUID()}`,
              employeeId: employee.id,
              subsidiaryId,
              employeeName,
              attendanceDate: now,
              arrivalTime: now,
              status: day.late
                ? AttendanceStatus.LATE
                : AttendanceStatus.PRESENT,
            },
          });
        } else {
          if (!today?.arrivalTime || today.departureTime)
            throw new BadRequestException({
              code: 'INVALID_DEPARTURE',
              message:
                'Le départ nécessite une arrivée enregistrée et ne peut être pointé qu’une fois.',
            });
          await tx.attendanceRecord.update({
            where: { id: today.id },
            data: {
              departureTime: now,
              status: AttendanceStatus.LEFT,
            },
          });
        }
        return {
          success: true,
          type: dto.action,
          employeeName,
          status:
            dto.action === 'departure' ? 'LEFT' : day.late ? 'LATE' : 'PRESENT',
          message: `${dto.action === 'arrival' ? 'Arrivée' : 'Départ'} enregistré à ${now.toLocaleTimeString('fr-FR', { timeZone: 'Africa/Douala' })}`,
        };
      },
      { timeout: 15000 },
    );
    return result;
  }
}
