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
exports.MaintenanceRecordService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const generate_id_util_1 = require("../../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../../common/constants/id-prefixes.const");
const pagination_1 = require("../../common/pagination/pagination");
let MaintenanceRecordService = class MaintenanceRecordService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    includeAll = {
        equipment: true,
    };
    async create(createMaintenanceRecordDto) {
        const maintenanceRecord = await this.prisma.maintenanceRecord.create({
            data: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.MAINTENANCERECORD),
                ...createMaintenanceRecordDto,
                maintenanceDate: new Date(createMaintenanceRecordDto.maintenanceDate),
            },
            include: this.includeAll,
        });
        return maintenanceRecord;
    }
    async findAll(query) {
        return (0, pagination_1.paginate)(this.prisma.maintenanceRecord, {
            where: { equipmentId: query.equipmentId },
            include: this.includeAll,
            orderBy: { maintenanceDate: 'desc' },
        }, query);
    }
    async findOne(id) {
        const record = await this.prisma.maintenanceRecord.findUnique({
            where: { id },
            include: this.includeAll,
        });
        if (!record)
            throw new common_1.NotFoundException(`Maintenance record with ID "${id}" not found`);
        return record;
    }
    async update(id, dto) {
        await this.findOne(id);
        const maintenanceRecord = await this.prisma.maintenanceRecord.update({
            where: { id },
            data: {
                ...dto,
                maintenanceDate: dto.maintenanceDate
                    ? new Date(dto.maintenanceDate)
                    : undefined,
            },
            include: this.includeAll,
        });
        return maintenanceRecord;
    }
    async remove(id) {
        await this.findOne(id);
        const maintenanceRecord = await this.prisma.maintenanceRecord.delete({
            where: { id },
        });
        return maintenanceRecord;
    }
    async search(dto) {
        return (0, pagination_1.paginate)(this.prisma.maintenanceRecord, {
            where: {
                equipmentId: dto.equipmentId,
                technician: dto.technician
                    ? { contains: dto.technician, mode: 'insensitive' }
                    : undefined,
                maintenanceDate: dto.fromDate || dto.toDate
                    ? {
                        gte: dto.fromDate ? new Date(dto.fromDate) : undefined,
                        lte: dto.toDate ? new Date(dto.toDate) : undefined,
                    }
                    : undefined,
            },
            include: this.includeAll,
            orderBy: { maintenanceDate: 'desc' },
        }, dto);
    }
};
exports.MaintenanceRecordService = MaintenanceRecordService;
exports.MaintenanceRecordService = MaintenanceRecordService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MaintenanceRecordService);
//# sourceMappingURL=maintenance_record.service.js.map