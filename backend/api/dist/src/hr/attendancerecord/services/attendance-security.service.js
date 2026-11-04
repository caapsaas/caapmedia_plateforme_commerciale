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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceSecurityService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../../common/utils/prisma/prisma.service");
const dynamic_token_service_1 = require("./dynamic-token.service");
const attendance_day_1 = require("./attendance-day");
let AttendanceSecurityService = class AttendanceSecurityService {
    prisma;
    tokens;
    constructor(prisma, tokens) {
        this.prisma = prisma;
        this.tokens = tokens;
    }
    async pointage(dto) {
        const result = await this.prisma.$transaction(async (tx) => {
            const subsidiaryId = await this.tokens.validateToken(dto.token, tx);
            await tx.$queryRaw `SELECT id FROM employees WHERE id = ${dto.matricule} FOR UPDATE`;
            const employee = await tx.employee.findFirst({
                where: { id: dto.matricule, subsidiaryId, status: 'ACTIVE' },
                select: { id: true, firstName: true, lastName: true },
            });
            if (!employee)
                throw new common_1.NotFoundException('Employé non trouvé ou inactif.');
            const now = new Date();
            await this.tokens.validateToken(dto.token, tx);
            const day = (0, attendance_day_1.attendanceDayBounds)(now);
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
                    throw new common_1.BadRequestException({
                        code: 'ALREADY_CHECKED_IN',
                        message: 'Une arrivée est déjà enregistrée aujourd’hui.',
                    });
                await tx.attendanceRecord.create({
                    data: {
                        id: `ATT-${(0, crypto_1.randomUUID)()}`,
                        employeeId: employee.id,
                        subsidiaryId,
                        employeeName,
                        attendanceDate: now,
                        arrivalTime: now,
                        status: day.late
                            ? client_1.AttendanceStatus.LATE
                            : client_1.AttendanceStatus.PRESENT,
                    },
                });
            }
            else {
                if (!today?.arrivalTime || today.departureTime)
                    throw new common_1.BadRequestException({
                        code: 'INVALID_DEPARTURE',
                        message: 'Le départ nécessite une arrivée enregistrée et ne peut être pointé qu’une fois.',
                    });
                await tx.attendanceRecord.update({
                    where: { id: today.id },
                    data: {
                        departureTime: now,
                        status: client_1.AttendanceStatus.LEFT,
                    },
                });
            }
            return {
                success: true,
                type: dto.action,
                employeeName,
                status: dto.action === 'departure' ? 'LEFT' : day.late ? 'LATE' : 'PRESENT',
                message: `${dto.action === 'arrival' ? 'Arrivée' : 'Départ'} enregistré à ${now.toLocaleTimeString('fr-FR', { timeZone: 'Africa/Douala' })}`,
            };
        }, { timeout: 15000 });
        return result;
    }
};
exports.AttendanceSecurityService = AttendanceSecurityService;
exports.AttendanceSecurityService = AttendanceSecurityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        dynamic_token_service_1.DynamicTokenService])
], AttendanceSecurityService);
//# sourceMappingURL=attendance-security.service.js.map