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
exports.EquipementService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const subsidiary_scope_1 = require("../../common/utils/subsidiary-scope");
let EquipementService = class EquipementService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    includeAll = {
        maintenanceRecords: true,
        subsidiary: true,
    };
    async create(createEquipementDto, user) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(user);
        const subsidiaryId = ctx.hasGlobalScope && createEquipementDto.subsidiaryId
            ? createEquipementDto.subsidiaryId
            : ctx.subsidiaryId;
        const rest = createEquipementDto;
        const equipment = await this.prisma.equipment.create({
            data: {
                equipmentName: rest.equipmentName,
                status: rest.status,
                acquisitionValue: rest.acquisitionValue,
                lastMaintenanceDate: new Date(rest.lastMaintenanceDate),
                nextMaintenanceDate: new Date(rest.nextMaintenanceDate),
                acquisitionDate: new Date(rest.acquisitionDate),
                subsidiaryId,
            },
            include: this.includeAll,
        });
        return equipment;
    }
    async findAll(user, querySubsidiaryId) {
        const where = (0, subsidiary_scope_1.withSubsidiaryScope)({}, (0, subsidiary_scope_1.resolveScopeContext)(user), querySubsidiaryId);
        const equipments = await this.prisma.equipment.findMany({
            where,
            include: this.includeAll,
            orderBy: [
                { subsidiary: { subsidiaryName: 'asc' } },
                { equipmentName: 'asc' },
            ],
            take: 1000,
        });
        return equipments;
    }
    async findOne(id, user) {
        const equipment = await this.prisma.equipment.findUnique({
            where: (0, subsidiary_scope_1.withSubsidiaryScope)({ id }, (0, subsidiary_scope_1.resolveScopeContext)(user)),
            include: this.includeAll,
        });
        if (!equipment) {
            throw new common_1.NotFoundException(`Equipment with ID "${id}" not found`);
        }
        return equipment;
    }
    async update(id, updateEquipementDto, user) {
        await this.findOne(id, user);
        const rest = updateEquipementDto;
        const data = {
            equipmentName: rest.equipmentName,
            status: rest.status,
            acquisitionValue: rest.acquisitionValue,
        };
        if (rest.lastMaintenanceDate)
            data.lastMaintenanceDate = new Date(rest.lastMaintenanceDate);
        if (rest.nextMaintenanceDate)
            data.nextMaintenanceDate = new Date(rest.nextMaintenanceDate);
        if (rest.acquisitionDate)
            data.acquisitionDate = new Date(rest.acquisitionDate);
        const equipment = await this.prisma.equipment.update({
            where: (0, subsidiary_scope_1.withSubsidiaryScope)({ id }, (0, subsidiary_scope_1.resolveScopeContext)(user)),
            data,
            include: this.includeAll,
        });
        if (!equipment) {
            throw new common_1.NotFoundException(`Equipment with ID "${id}" not found`);
        }
        return equipment;
    }
    async remove(id, user) {
        await this.findOne(id, user);
        const equipment = await this.prisma.equipment.delete({
            where: (0, subsidiary_scope_1.withSubsidiaryScope)({ id }, (0, subsidiary_scope_1.resolveScopeContext)(user)),
            include: this.includeAll,
        });
        return equipment;
    }
    async search(query, user) {
        const where = (0, subsidiary_scope_1.withSubsidiaryScope)({}, (0, subsidiary_scope_1.resolveScopeContext)(user));
        if (query.equipmentName) {
            where.equipmentName = {
                contains: query.equipmentName,
                mode: 'insensitive',
            };
        }
        if (query.status) {
            where.status = query.status;
        }
        if (query.acquisitionFromDate || query.acquisitionToDate) {
            where.acquisitionDate = {
                gte: query.acquisitionFromDate
                    ? new Date(query.acquisitionFromDate)
                    : undefined,
                lte: query.acquisitionToDate
                    ? new Date(query.acquisitionToDate)
                    : undefined,
            };
        }
        if (query.lastMaintenanceFromDate || query.lastMaintenanceToDate) {
            where.lastMaintenanceDate = {
                gte: query.lastMaintenanceFromDate
                    ? new Date(query.lastMaintenanceFromDate)
                    : undefined,
                lte: query.lastMaintenanceToDate
                    ? new Date(query.lastMaintenanceToDate)
                    : undefined,
            };
        }
        if (query.nextMaintenanceFromDate || query.nextMaintenanceToDate) {
            where.nextMaintenanceDate = {
                gte: query.nextMaintenanceFromDate
                    ? new Date(query.nextMaintenanceFromDate)
                    : undefined,
                lte: query.nextMaintenanceToDate
                    ? new Date(query.nextMaintenanceToDate)
                    : undefined,
            };
        }
        return this.prisma.equipment.findMany({
            where,
            include: {
                subsidiary: true,
                maintenanceRecords: true,
            },
            orderBy: [
                { subsidiary: { subsidiaryName: 'asc' } },
                { equipmentName: 'asc' },
            ],
            take: 1000,
        });
    }
};
exports.EquipementService = EquipementService;
exports.EquipementService = EquipementService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EquipementService);
//# sourceMappingURL=equipement.service.js.map