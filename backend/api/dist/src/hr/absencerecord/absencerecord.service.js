"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AbsenceRecordService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbsenceRecordService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const generate_id_util_1 = require("../../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../../common/constants/id-prefixes.const");
const pagination_1 = require("../../common/pagination/pagination");
let AbsenceRecordService = AbsenceRecordService_1 = class AbsenceRecordService {
    prisma;
    logger = new common_1.Logger(AbsenceRecordService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, employeeId, subsidiaryId) {
        this.logger.log(`Creating absence record for employee ${employeeId} with data: ${JSON.stringify(dto)}`);
        if (!dto.typeAbsence) {
            throw new common_1.BadRequestException('Absence type (typeAbsence) is required.');
        }
        return this.prisma.absenceRecord.create({
            data: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ABSENCE),
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
    async findAll(subsidiaryId, paginationQuery = {}) {
        const where = subsidiaryId
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
        return (0, pagination_1.paginate)(this.prisma.absenceRecord, {
            where,
            include: { employee: true, subsidiary: true },
            orderBy: { startDate: 'desc' },
        }, paginationQuery);
    }
    async findOne(id) {
        const record = await this.prisma.absenceRecord.findUnique({
            where: { id },
            include: { employee: true },
        });
        if (!record) {
            throw new common_1.NotFoundException(`Absence record with ID ${id} not found.`);
        }
        return record;
    }
    async update(id, dto) {
        this.logger.log(`Updating absence record ${id}`);
        await this.findOne(id);
        const dataToUpdate = {};
        if (dto.typeAbsence)
            dataToUpdate.typeAbsence = dto.typeAbsence;
        if (dto.startDate)
            dataToUpdate.startDate = new Date(dto.startDate);
        if (dto.endDate)
            dataToUpdate.endDate = new Date(dto.endDate);
        if (dto.reason !== undefined)
            dataToUpdate.reason = dto.reason;
        if (dto.documentUrl !== undefined)
            dataToUpdate.documentUrl = dto.documentUrl;
        return this.prisma.absenceRecord.update({
            where: { id },
            data: dataToUpdate,
            include: { employee: true, subsidiary: true },
        });
    }
    async remove(id) {
        this.logger.log(`Removing absence record ${id}`);
        await this.findOne(id);
        return this.prisma.absenceRecord.delete({ where: { id } });
    }
    async getSubsidiaryCalendar(subsidiaryId) {
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
        if (!subsidiary)
            throw new common_1.NotFoundException('Filiale introuvable.');
        return { workingDays: subsidiary.workingDays, holidays };
    }
    async updateWorkingDays(subsidiaryId, workingDays) {
        const uniqueDays = [...new Set(workingDays)];
        if (uniqueDays.length === 0 ||
            uniqueDays.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) {
            throw new common_1.BadRequestException('Les jours travaillés doivent être compris entre 0 et 6.');
        }
        const subsidiary = await this.prisma.subsidiary.update({
            where: { id: subsidiaryId },
            data: { workingDays: uniqueDays.sort((a, b) => a - b) },
            select: { id: true, workingDays: true },
        });
        return subsidiary;
    }
    async addHoliday(subsidiaryId, date, name) {
        const parsedDate = new Date(`${date}T00:00:00.000Z`);
        if (!date || Number.isNaN(parsedDate.getTime()) || !name.trim()) {
            throw new common_1.BadRequestException('La date et le nom du jour férié sont requis.');
        }
        try {
            return await this.prisma.subsidiaryHoliday.create({
                data: { subsidiaryId, date: parsedDate, name: name.trim() },
            });
        }
        catch (error) {
            if (error?.code === 'P2002') {
                throw new common_1.ConflictException('Un jour férié existe déjà à cette date.');
            }
            throw error;
        }
    }
    async removeHoliday(subsidiaryId, holidayId) {
        const holiday = await this.prisma.subsidiaryHoliday.findFirst({
            where: { id: holidayId, subsidiaryId },
        });
        if (!holiday)
            throw new common_1.NotFoundException('Jour férié introuvable.');
        return this.prisma.subsidiaryHoliday.delete({ where: { id: holiday.id } });
    }
    async generateDailyAbsences(subsidiaryId) {
        this.logger.log('🔄 Génération automatique des absences du jour...');
        return this.generateAbsencesForDate(new Date(), subsidiaryId);
    }
    async generateAbsencesForDate(date = new Date(), subsidiaryId) {
        try {
            const localDate = new Intl.DateTimeFormat('en-CA', {
                timeZone: 'Africa/Douala', year: 'numeric', month: '2-digit', day: '2-digit',
            }).format(date);
            const today = new Date(`${localDate}T00:00:00.000Z`);
            const tomorrow = new Date(today);
            tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
            const dayOfWeek = today.getUTCDay();
            const attendanceStart = new Date(today.getTime() - 60 * 60 * 1000);
            const attendanceEnd = new Date(tomorrow.getTime() - 60 * 60 * 1000);
            const subsidiaries = subsidiaryId
                ? await this.prisma.subsidiary.findMany({ where: { id: subsidiaryId } })
                : await this.prisma.subsidiary.findMany();
            let totalCreated = 0;
            const details = [];
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
                if (employees.length === 0)
                    continue;
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
                const presentIds = new Set(attendancesToday
                    .filter((a) => a.arrivalTime && a.departureTime)
                    .map((a) => a.employeeId));
                const incompleteAttendanceIds = new Set(attendancesToday
                    .filter((a) => a.arrivalTime && !a.departureTime)
                    .map((a) => a.employeeId));
                const absencesToday = await this.prisma.absenceRecord.findMany({
                    where: {
                        subsidiaryId: subsidiary.id,
                        startDate: { lt: tomorrow },
                        endDate: { gte: today },
                    },
                    select: { employeeId: true },
                });
                const alreadyAbsentIds = new Set(absencesToday.map((a) => a.employeeId));
                const leavesToday = await this.prisma.employeeLeaveRecord.findMany({
                    where: {
                        employeeId: { in: employees.map((employee) => employee.id) },
                        startDate: { lte: today },
                        endDate: { gte: today },
                    },
                    select: { employeeId: true },
                });
                const onLeaveIds = new Set(leavesToday.map((leave) => leave.employeeId));
                const toMarkAbsent = employees.filter((e) => !alreadyAbsentIds.has(e.id) &&
                    !onLeaveIds.has(e.id) &&
                    (!presentIds.has(e.id) || incompleteAttendanceIds.has(e.id)));
                const excludedForLeave = employees.filter((e) => onLeaveIds.has(e.id)).length;
                for (const employee of toMarkAbsent) {
                    const isIncompleteAttendance = incompleteAttendanceIds.has(employee.id);
                    const reason = isIncompleteAttendance
                        ? 'Absence générée automatiquement — arrivée signalée mais pas de départ'
                        : 'Absence générée automatiquement — aucune présence signalée';
                    await this.prisma.absenceRecord.create({
                        data: {
                            id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ABSENCE),
                            employeeId: employee.id,
                            subsidiaryId: employee.subsidiaryId,
                            employeeName: `${employee.firstName} ${employee.lastName}`,
                            typeAbsence: 'UNJUSTIFIED',
                            startDate: today,
                            endDate: today,
                            reason,
                            documentUrl: null,
                        },
                    });
                    totalCreated++;
                    this.logger.debug(`✓ Absence auto : ${employee.firstName} ${employee.lastName}` +
                        (isIncompleteAttendance ? ' (arrivée sans départ)' : ''));
                }
                const detail = `Filiale ${subsidiary.subsidiaryName || subsidiary.id}: ${toMarkAbsent.length} absence(s) créée(s), ${excludedForLeave} congé(s) ignoré(s), sur ${employees.length} employé(s) actif(s)`;
                details.push(detail);
                this.logger.log(detail);
            }
            const message = totalCreated > 0
                ? `${totalCreated} absence(s) non justifiée(s) générée(s) pour les employés sans présence du jour. ` +
                    details.join('. ')
                : `Aucune absence n'a été générée. ${details.join('. ') || "Tous les employés actifs ont complété leur présence aujourd'hui."}`;
            this.logger.log(`✓ Génération terminée — ${totalCreated} absence(s) au total`);
            return { success: true, message };
        }
        catch (error) {
            this.logger.error(`Erreur génération absences: ${error.message}`, error.stack);
            return {
                success: false,
                message: `Erreur lors de la génération: ${error.message}`,
            };
        }
    }
};
exports.AbsenceRecordService = AbsenceRecordService;
__decorate([
    (0, schedule_1.Cron)('0 18 * * *', { timeZone: 'Africa/Douala' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AbsenceRecordService.prototype, "generateDailyAbsences", null);
exports.AbsenceRecordService = AbsenceRecordService = AbsenceRecordService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AbsenceRecordService);
//# sourceMappingURL=absencerecord.service.js.map