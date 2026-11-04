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
exports.EquipmentCostConfigService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../common/utils/prisma/prisma.service");
const client_1 = require("@prisma/client");
const generate_id_util_1 = require("../../../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../../../common/constants/id-prefixes.const");
let EquipmentCostConfigService = class EquipmentCostConfigService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async upsert(dto, user) {
        const equipment = await this.prisma.equipment.findUnique({
            where: { id: dto.equipmentId },
        });
        if (!equipment) {
            throw new common_1.NotFoundException(`Équipement ${dto.equipmentId} introuvable.`);
        }
        return this.prisma.equipementCostConfig.upsert({
            where: { equipmentId: dto.equipmentId },
            create: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.EQUIPEMENTCOSTCONFIG),
                equipmentId: dto.equipmentId,
                hourlyRate: new client_1.Prisma.Decimal(dto.hourlyRate),
                updatedById: user.id,
            },
            update: {
                hourlyRate: new client_1.Prisma.Decimal(dto.hourlyRate),
                updatedById: user.id,
            },
            include: { equipment: true },
        });
    }
    async findAll(subsidiaryId, user) {
        const isSuperAdmin = user?.role === client_1.UserRole.SUPER_ADMIN ||
            user?.roles?.includes(client_1.UserRole.SUPER_ADMIN);
        const subsidiaryFilter = isSuperAdmin
            ? subsidiaryId
                ? { subsidiaryId }
                : {}
            : { subsidiaryId: user?.subsidiaryId };
        const equipments = await this.prisma.equipment.findMany({
            where: subsidiaryFilter,
            include: {
                costConfig: true,
                subsidiary: { select: { id: true, subsidiaryName: true } },
            },
            orderBy: [
                { subsidiary: { subsidiaryName: 'asc' } },
                { equipmentName: 'asc' },
            ],
        });
        return equipments.map((eq) => ({
            id: eq.id,
            equipmentName: eq.equipmentName,
            status: eq.status,
            subsidiaryId: eq.subsidiaryId,
            subsidiaryName: eq.subsidiary.subsidiaryName,
            hourlyRate: eq.costConfig?.hourlyRate ?? null,
            costConfigId: eq.costConfig?.id ?? null,
            isConfigured: eq.costConfig !== null,
        }));
    }
    async findOne(equipmentId) {
        const equipment = await this.prisma.equipment.findUnique({
            where: { id: equipmentId },
            include: {
                costConfig: true,
                subsidiary: { select: { id: true, subsidiaryName: true } },
            },
        });
        if (!equipment)
            throw new common_1.NotFoundException(`Équipement ${equipmentId} introuvable.`);
        return {
            id: equipment.id,
            equipmentName: equipment.equipmentName,
            status: equipment.status,
            subsidiaryId: equipment.subsidiaryId,
            subsidiaryName: equipment.subsidiary.subsidiaryName,
            hourlyRate: equipment.costConfig?.hourlyRate ?? null,
            isConfigured: equipment.costConfig !== null,
        };
    }
    async findConfigured(subsidiaryId) {
        const equipments = await this.prisma.equipment.findMany({
            where: {
                ...(subsidiaryId ? { subsidiaryId } : {}),
                costConfig: { isNot: null },
                status: 'OPERATIONAL',
            },
            include: {
                costConfig: true,
                subsidiary: { select: { id: true, subsidiaryName: true } },
            },
            orderBy: { equipmentName: 'asc' },
        });
        return equipments.map((eq) => ({
            id: eq.id,
            equipmentName: eq.equipmentName,
            status: eq.status,
            subsidiaryId: eq.subsidiaryId,
            subsidiaryName: eq.subsidiary.subsidiaryName,
            hourlyRate: eq.costConfig.hourlyRate,
        }));
    }
};
exports.EquipmentCostConfigService = EquipmentCostConfigService;
exports.EquipmentCostConfigService = EquipmentCostConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EquipmentCostConfigService);
//# sourceMappingURL=equipment-cost-config.service.js.map