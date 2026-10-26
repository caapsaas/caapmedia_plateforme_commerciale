import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import {
  CreateAbsenceRecordDto,
  UpdateAbsenceRecordDto,
} from './dto/absencerecord.dto';
import { AbsenceRecord, Prisma } from '@prisma/client';
import { generateId } from '../../common/utils/generate-id.util';
import { ID_PREFIXES } from '../../common/constants/id-prefixes.const';
import { PaginationQueryDto } from '../../common/pagination/dto/pagination-query.dto';
import { paginate, PaginatedResult } from '../../common/pagination/pagination';

@Injectable()
export class AbsenceRecordService {
  private readonly logger = new Logger(AbsenceRecordService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ------------------------------------------------------------------
  // CRUD existant (inchangé)
  // ------------------------------------------------------------------

  async create(
    dto: CreateAbsenceRecordDto,
    employeeId: string,
    subsidiaryId: string,
  ): Promise<AbsenceRecord> {
    this.logger.log(
      `Creating absence record for employee ${employeeId} with data: ${JSON.stringify(dto)}`,
    );
    if (!dto.typeAbsence) {
      throw new BadRequestException('Absence type (typeAbsence) is required.');
    }
    return this.prisma.absenceRecord.create({
      data: {
        id: generateId(ID_PREFIXES.ABSENCE),
        employeeName: dto.employeeName,
        typeAbsence: dto.typeAbsence,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        reason: dto.reason,
        documentUrl: dto.documentUrl,
        employeeId,
        subsidiaryId,
      },
      include: { employee: true, subsidiary: true },
    });
  }

  async findAll(
    subsidiaryId?: string,
    paginationQuery: PaginationQueryDto = {},
  ): Promise<PaginatedResult<AbsenceRecord>> {
    const where: Prisma.AbsenceRecordWhereInput = subsidiaryId
      ? { subsidiaryId }
      : {};

    if (paginationQuery.search) {
      where.OR = [
        {
          employeeName: {
            contains: paginationQuery.search,
            mode: 'insensitive',
          },
        },
        {
          reason: { contains: paginationQuery.search, mode: 'insensitive' },
        },
      ];
    }

    return paginate<AbsenceRecord>(
      this.prisma.absenceRecord,
      {
        where,
        include: { employee: true, subsidiary: true },
        orderBy: { startDate: 'desc' },
      },
      paginationQuery,
    );
  }

  async findOne(id: string): Promise<AbsenceRecord> {
    const record = await this.prisma.absenceRecord.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!record) {
      throw new NotFoundException(`Absence record with ID ${id} not found.`);
    }
    return record;
  }

  async update(
    id: string,
    dto: UpdateAbsenceRecordDto,
  ): Promise<AbsenceRecord> {
    this.logger.log(`Updating absence record ${id}`);
    await this.findOne(id);

    const dataToUpdate: Prisma.AbsenceRecordUpdateInput = {};
    if (dto.typeAbsence) dataToUpdate.typeAbsence = dto.typeAbsence;
    if (dto.startDate) dataToUpdate.startDate = new Date(dto.startDate);
    if (dto.endDate) dataToUpdate.endDate = new Date(dto.endDate);
    if (dto.reason !== undefined) dataToUpdate.reason = dto.reason;
    if (dto.documentUrl !== undefined)
      dataToUpdate.documentUrl = dto.documentUrl;

    return this.prisma.absenceRecord.update({
      where: { id },
      data: dataToUpdate,
      include: { employee: true, subsidiary: true },
    });
  }

  async remove(id: string): Promise<AbsenceRecord> {
    this.logger.log(`Removing absence record ${id}`);
    await this.findOne(id);
    return this.prisma.absenceRecord.delete({ where: { id } });
  }

  async getSubsidiaryCalendar(subsidiaryId: string) {
    const [subsidiary, holidays] = await Promise.all([
      this.prisma.subsidiary.findUnique({
        where: { id: subsidiaryId },
        select: { id: true, workingDays: true },
      }),
      this.prisma.subsidiaryHoliday.findMany({
        where: { subsidiaryId },
        orderBy: { date: 'asc' },
      }),
    ]);
    if (!subsidiary) throw new NotFoundException('Filiale introuvable.');
    return { workingDays: subsidiary.workingDays, holidays };
  }

  async updateWorkingDays(subsidiaryId: string, workingDays: number[]) {
    const uniqueDays = [...new Set(workingDays)];
    if (
      uniqueDays.length === 0 ||
      uniqueDays.some((day) => !Number.isInteger(day) || day < 0 || day > 6)
    ) {
      throw new BadRequestException('Les jours travaillés doivent être compris entre 0 et 6.');
    }
    const subsidiary = await this.prisma.subsidiary.update({
      where: { id: subsidiaryId },
      data: { workingDays: uniqueDays.sort((a, b) => a - b) },
      select: { id: true, workingDays: true },
    });
    return subsidiary;
  }

  async addHoliday(subsidiaryId: string, date: string, name: string) {
    const parsedDate = new Date(`${date}T00:00:00.000Z`);
    if (!date || Number.isNaN(parsedDate.getTime()) || !name.trim()) {
      throw new BadRequestException('La date et le nom du jour férié sont requis.');
    }
    try {
      return await this.prisma.subsidiaryHoliday.create({
        data: { subsidiaryId, date: parsedDate, name: name.trim() },
      });
    } catch (error) {
      if (error?.code === 'P2002') {
        throw new ConflictException('Un jour férié existe déjà à cette date.');
      }
      throw error;
    }
  }

  async removeHoliday(subsidiaryId: string, holidayId: string) {
    const holiday = await this.prisma.subsidiaryHoliday.findFirst({
      where: { id: holidayId, subsidiaryId },
    });
    if (!holiday) throw new NotFoundException('Jour férié introuvable.');
    return this.prisma.subsidiaryHoliday.delete({ where: { id: holiday.id } });
  }

  // ------------------------------------------------------------------
  // ★ Génération automatique des absences en fin de journée
  // ------------------------------------------------------------------

  /**
   * Tous les jours à 18h00, heure de Douala.
   * Pour chaque filiale :
   *  - récupère les employés ACTIVE
   *  - exclut ceux qui ont déjà une présence complète aujourd'hui (arrivée + départ)
   *  - exclut ceux qui ont déjà une absence couvrant aujourd'hui
   *  - crée une absence pour :
   *    * employés sans présence du tout
   *    * employés avec arrivée mais sans départ
   */
  @Cron('0 18 * * *', { timeZone: 'Africa/Douala' })
  async generateDailyAbsences(
    subsidiaryId?: string,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log('🔄 Génération automatique des absences du jour...');

    return this.generateAbsencesForDate(new Date(), subsidiaryId);
  }

  async generateAbsencesForDate(
    date: Date = new Date(),
    subsidiaryId?: string,
  ): Promise<{ success: boolean; message: string }> {

    try {
      const localDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Africa/Douala', year: 'numeric', month: '2-digit', day: '2-digit',
      }).format(date);
      const today = new Date(`${localDate}T00:00:00.000Z`);

      const tomorrow = new Date(today);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      const dayOfWeek = today.getUTCDay();
      // Pointage dates are stored as timestamps; Douala is UTC+1. Query its
      // local calendar day instead of the UTC day to include early arrivals.
      const attendanceStart = new Date(today.getTime() - 60 * 60 * 1000);
      const attendanceEnd = new Date(tomorrow.getTime() - 60 * 60 * 1000);

      const subsidiaries = subsidiaryId
        ? await this.prisma.subsidiary.findMany({ where: { id: subsidiaryId } })
        : await this.prisma.subsidiary.findMany();
      let totalCreated = 0;
      const details: string[] = [];

      for (const subsidiary of subsidiaries) {
        if (!subsidiary.workingDays.includes(dayOfWeek)) {
          details.push(`${subsidiary.subsidiaryName || subsidiary.id}: jour non travaillé, génération ignorée`);
          continue;
        }

        const holiday = await this.prisma.subsidiaryHoliday.findUnique({
          where: {
            subsidiaryId_date: { subsidiaryId: subsidiary.id, date: today },
          },
        });
        if (holiday) {
          details.push(`${subsidiary.subsidiaryName || subsidiary.id}: ${holiday.name}, génération ignorée`);
          continue;
        }

        // 1. Employés actifs
        const employees = await this.prisma.employee.findMany({
          where: {
            subsidiaryId: subsidiary.id,
            status: 'ACTIVE',
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            subsidiaryId: true,
          },
        });

        if (employees.length === 0) continue;

        // 2. Présences du jour (arrivée + départ valides)
        const attendancesToday = await this.prisma.attendanceRecord.findMany({
          where: {
            subsidiaryId: subsidiary.id,
            attendanceDate: {
              gte: attendanceStart,
              lt: attendanceEnd,
            },
          },
          select: { employeeId: true, arrivalTime: true, departureTime: true },
        });

        // Un employé est considéré comme "présent" s'il a à la fois arrivée ET départ
        const presentIds = new Set(
          attendancesToday
            .filter((a) => a.arrivalTime && a.departureTime)
            .map((a) => a.employeeId),
        );

        // Employés avec arrivée mais pas de départ
        const incompleteAttendanceIds = new Set(
          attendancesToday
            .filter((a) => a.arrivalTime && !a.departureTime)
            .map((a) => a.employeeId),
        );

        // 3. Absences déjà enregistrées qui couvrent aujourd'hui
        const absencesToday = await this.prisma.absenceRecord.findMany({
          where: {
            subsidiaryId: subsidiary.id,
            startDate: { lt: tomorrow },
            endDate: { gte: today }, // endDate >= début de journée
          },
          select: { employeeId: true },
        });
        const alreadyAbsentIds = new Set(
          absencesToday.map((a) => a.employeeId),
        );

        // A leave record in this system represents a scheduled leave. Its dates
        // are authoritative because no approval workflow exists yet.
        const leavesToday = await this.prisma.employeeLeaveRecord.findMany({
          where: {
            employeeId: { in: employees.map((employee) => employee.id) },
            startDate: { lte: today },
            endDate: { gte: today },
          },
          select: { employeeId: true },
        });
        const onLeaveIds = new Set(leavesToday.map((leave) => leave.employeeId));

        // 4. Employés à marquer comme absent :
        //    - sans présence ET sans absence
        //    - OU avec arrivée mais pas départ (et pas d'absence existante)
        const toMarkAbsent = employees.filter(
          (e) =>
            !alreadyAbsentIds.has(e.id) &&
            !onLeaveIds.has(e.id) &&
            (!presentIds.has(e.id) || incompleteAttendanceIds.has(e.id)),
        );
        const excludedForLeave = employees.filter((e) => onLeaveIds.has(e.id)).length;

        // 5. Création des absences
        for (const employee of toMarkAbsent) {
          const isIncompleteAttendance = incompleteAttendanceIds.has(
            employee.id,
          );
          const reason = isIncompleteAttendance
            ? 'Absence générée automatiquement — arrivée signalée mais pas de départ'
            : 'Absence générée automatiquement — aucune présence signalée';

          await this.prisma.absenceRecord.create({
            data: {
              id: generateId(ID_PREFIXES.ABSENCE),
              employeeId: employee.id,
              subsidiaryId: employee.subsidiaryId,
              employeeName: `${employee.firstName} ${employee.lastName}`,
              typeAbsence: 'UNJUSTIFIED' as any,
              startDate: today,
              endDate: today,
              reason,
              documentUrl: null,
            },
          });

          totalCreated++;
          this.logger.debug(
            `✓ Absence auto : ${employee.firstName} ${employee.lastName}` +
              (isIncompleteAttendance ? ' (arrivée sans départ)' : ''),
          );
        }

        const detail = `Filiale ${subsidiary.subsidiaryName || subsidiary.id}: ${toMarkAbsent.length} absence(s) créée(s), ${excludedForLeave} congé(s) ignoré(s), sur ${employees.length} employé(s) actif(s)`;
        details.push(detail);
        this.logger.log(detail);
      }

      const message =
        totalCreated > 0
          ? `${totalCreated} absence(s) non justifiée(s) générée(s) pour les employés sans présence du jour. ` +
            details.join('. ')
          : `Aucune absence n'a été générée. ${details.join('. ') || "Tous les employés actifs ont complété leur présence aujourd'hui."}`;

      this.logger.log(
        `✓ Génération terminée — ${totalCreated} absence(s) au total`,
      );

      return { success: true, message };
    } catch (error) {
      this.logger.error(
        `Erreur génération absences: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        message: `Erreur lors de la génération: ${error.message}`,
      };
    }
  }

}
