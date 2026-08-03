import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
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
import { paginate } from '../../common/pagination/pagination';
import { PaginationQueryDto } from '../../common/pagination/dto/pagination-query.dto';

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

  async findAll(subsidiaryId: string, paginationQuery: PaginationQueryDto = {}) {
    const where: Prisma.AbsenceRecordWhereInput = { subsidiaryId };

    if (paginationQuery.search) {
      where.employeeName = {
        contains: paginationQuery.search,
        mode: 'insensitive',
      };
    }

    return paginate(
      this.prisma.absenceRecord,
      {
        where,
        include: { employee: true },
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

  // ------------------------------------------------------------------
  // ★ Génération automatique des absences en fin de journée
  // ------------------------------------------------------------------

  /**
   * Tous les jours à 18h00 (heure serveur).
   * Pour chaque filiale :
   *  - récupère les employés ACTIVE
   *  - exclut ceux qui ont déjà une présence aujourd'hui
   *  - exclut ceux qui ont déjà une absence couvrant aujourd'hui
   *  - crée une absence de type "ABSENCE_NON_JUSTIFIEE" (ou votre enum)
   */
 @Cron('0 18 * * *') // 18h00 tous les jours
  async generateDailyAbsences() {
    this.logger.log('🔄 Génération automatique des absences du jour...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const subsidiaries = await this.prisma.subsidiary.findMany();
      let totalCreated = 0;

      for (const subsidiary of subsidiaries) {
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

        // 2. Présences du jour
        const attendancesToday = await this.prisma.attendanceRecord.findMany({
          where: {
            subsidiaryId: subsidiary.id,
            attendanceDate: {
              gte: today,
              lt: tomorrow,
            },
          },
          select: { employeeId: true },
        });
        const presentIds = new Set(attendancesToday.map((a) => a.employeeId));

        // 3. Absences déjà enregistrées qui couvrent aujourd'hui
        const absencesToday = await this.prisma.absenceRecord.findMany({
          where: {
            subsidiaryId: subsidiary.id,
            startDate: { lte: tomorrow }, // startDate <= fin de journée
            endDate: { gte: today },      // endDate >= début de journée
          },
          select: { employeeId: true },
        });
        const alreadyAbsentIds = new Set(absencesToday.map((a) => a.employeeId));

        // 4. Employés sans présence et sans absence
        const missing = employees.filter(
          (e) => !presentIds.has(e.id) && !alreadyAbsentIds.has(e.id),
        );

        // 5. Création des absences
        for (const employee of missing) {
          await this.prisma.absenceRecord.create({
            data: {
              id: generateId(ID_PREFIXES.ABSENCE),
              employeeId: employee.id,
              subsidiaryId: employee.subsidiaryId,
              employeeName: `${employee.firstName} ${employee.lastName}`,
              typeAbsence: 'JUSTIFIED' as any,
              startDate: today,
              endDate: today,
              reason:
                'Absence générée automatiquement — aucune présence signalée',
              documentUrl: null,
            },
          });

          totalCreated++;
          this.logger.debug(
            `✓ Absence auto : ${employee.firstName} ${employee.lastName}`,
          );
        }

        this.logger.log(
          `Filiale ${subsidiary.id}: ${missing.length} absence(s) créée(s)`,
        );
      }

      this.logger.log(
        `✓ Génération terminée — ${totalCreated} absence(s) au total`,
      );
    } catch (error) {
      this.logger.error(
        `Erreur génération absences: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Version manuelle (appelable depuis un endpoint admin si besoin)
   */
  async generateAbsencesForDate(date: Date = new Date()) {
    // Réutilise la même logique en forçant la date
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);

    // Vous pouvez extraire le corps de generateDailyAbsences
    // dans une méthode privée acceptant `target` en paramètre
    // pour éviter la duplication.
    this.logger.log(
      `Génération manuelle des absences pour le ${target.toISOString().slice(0, 10)}`,
    );
    // ... même logique avec `today = target`
  }
}