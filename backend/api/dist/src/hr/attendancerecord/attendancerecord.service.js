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
var AttendanceRecordService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceRecordService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const generate_id_util_1 = require("../../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../../common/constants/id-prefixes.const");
const pagination_1 = require("../../common/pagination/pagination");
let AttendanceRecordService = AttendanceRecordService_1 = class AttendanceRecordService {
    prisma;
    logger = new common_1.Logger(AttendanceRecordService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createAttendanceRecordDto, employeeId, subsidiaryId) {
        this.logger.log(`Creating attendance record for employee ${employeeId}`);
        const existingToday = await this.findTodayRecord(employeeId, subsidiaryId);
        if (existingToday) {
            throw new common_1.BadRequestException("Un enregistrement de présence existe déjà pour aujourd'hui");
        }
        return this.prisma.attendanceRecord.create({
            data: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ATTENDANCE),
                employeeId,
                subsidiaryId,
                employeeName: createAttendanceRecordDto.employeeName ?? '',
                attendanceDate: createAttendanceRecordDto.attendanceDate,
                status: createAttendanceRecordDto.status,
                arrivalTime: createAttendanceRecordDto.arrivalTime ?? null,
                departureTime: createAttendanceRecordDto.departureTime ?? null,
                breakStartTime: createAttendanceRecordDto.breakStartTime ?? null,
                breakEndTime: createAttendanceRecordDto.breakEndTime ?? null,
                signature: createAttendanceRecordDto.signature ?? null,
                arrivalLatitude: createAttendanceRecordDto.arrivalLatitude ?? null,
                arrivalLongitude: createAttendanceRecordDto.arrivalLongitude ?? null,
                departureLatitude: createAttendanceRecordDto.departureLatitude ?? null,
                departureLongitude: createAttendanceRecordDto.departureLongitude ?? null,
                isGeolocationValid: createAttendanceRecordDto.isGeolocationValid ?? false,
                accuracyMeters: createAttendanceRecordDto.accuracyMeters ?? null,
            },
            include: {
                employee: true,
                subsidiary: true,
            },
        });
    }
    async findTodayRecord(employeeId, subsidiaryId) {
        const now = new Date();
        const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
        const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
        return this.prisma.attendanceRecord.findFirst({
            where: {
                employeeId,
                subsidiaryId,
                attendanceDate: {
                    gte: startOfDay,
                    lt: endOfDay,
                },
            },
        });
    }
    async findByDateRange(employeeId, subsidiaryId, startDate, endDate) {
        const where = {
            subsidiaryId,
            attendanceDate: {
                gte: startDate,
                lt: endDate,
            },
        };
        if (employeeId) {
            where.employeeId = employeeId;
        }
        return this.prisma.attendanceRecord.findMany({
            where,
            include: {
                employee: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
            orderBy: { attendanceDate: 'desc' },
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
                    employee: {
                        firstName: {
                            contains: paginationQuery.search,
                            mode: 'insensitive',
                        },
                    },
                },
                {
                    employee: {
                        lastName: {
                            contains: paginationQuery.search,
                            mode: 'insensitive',
                        },
                    },
                },
            ];
        }
        return (0, pagination_1.paginate)(this.prisma.attendanceRecord, {
            where,
            include: {
                employee: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
            orderBy: { attendanceDate: 'desc' },
        }, paginationQuery);
    }
    async findOne(id) {
        const record = await this.prisma.attendanceRecord.findUnique({
            where: { id },
            include: { employee: true },
        });
        if (!record) {
            throw new common_1.NotFoundException(`Attendance record ${id} not found`);
        }
        return record;
    }
    async update(id, updateAttendanceRecordDto) {
        this.logger.log(`Updating attendance record ${id}`);
        await this.findOne(id);
        return this.prisma.attendanceRecord.update({
            where: { id },
            data: updateAttendanceRecordDto,
            include: { employee: true },
        });
    }
    async remove(id) {
        this.logger.log(`Removing attendance record ${id}`);
        await this.findOne(id);
        return this.prisma.attendanceRecord.delete({
            where: { id },
        });
    }
};
exports.AttendanceRecordService = AttendanceRecordService;
exports.AttendanceRecordService = AttendanceRecordService = AttendanceRecordService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AttendanceRecordService);
//# sourceMappingURL=attendancerecord.service.js.map