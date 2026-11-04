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
exports.PeriodsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const generate_id_util_1 = require("../../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../../common/constants/id-prefixes.const");
let PeriodsService = class PeriodsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOrCreateCurrentFiscalYear(subsidiaryId) {
        const year = new Date().getFullYear();
        const name = `Exercice ${year}`;
        const existing = await this.prisma.fiscalYear.findUnique({
            where: { subsidiaryId_name: { subsidiaryId, name } },
        });
        if (existing)
            return existing;
        return this.create({ name, startDate: `${year}-01-01`, endDate: `${year}-12-31` }, subsidiaryId);
    }
    async create(dto, subsidiaryId) {
        const startDate = new Date(dto.startDate);
        const endDate = new Date(dto.endDate);
        if (startDate >= endDate) {
            throw new common_1.BadRequestException('La date de début doit être antérieure à la date de fin.');
        }
        const overlapping = await this.prisma.fiscalYear.findFirst({
            where: {
                subsidiaryId,
                startDate: { lte: endDate },
                endDate: { gte: startDate },
            },
        });
        if (overlapping) {
            throw new common_1.BadRequestException(`Cet exercice chevauche un exercice existant (${overlapping.name}, ${overlapping.startDate.toLocaleDateString('fr-FR')} - ${overlapping.endDate.toLocaleDateString('fr-FR')}).`);
        }
        return this.prisma.fiscalYear.create({
            data: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.FISCALYEAR),
                name: dto.name,
                startDate,
                endDate,
                isActive: true,
                isClosed: false,
                subsidiaryId,
            },
        });
    }
    async findAll(user) {
        return this.prisma.fiscalYear.findMany({
            where: { subsidiaryId: user.subsidiaryId },
            orderBy: { startDate: 'desc' },
        });
    }
    async findActive(subsidiaryId) {
        return this.prisma.fiscalYear.findFirst({
            where: { subsidiaryId, isActive: true, isClosed: false },
            orderBy: { startDate: 'desc' },
        });
    }
    async close(id, user) {
        const fy = await this.prisma.fiscalYear.findFirst({
            where: { id, subsidiaryId: user.subsidiaryId },
        });
        if (!fy)
            throw new common_1.NotFoundException('Exercice introuvable.');
        if (fy.isClosed)
            throw new common_1.BadRequestException('Cet exercice est déjà clôturé.');
        const drafts = await this.prisma.journalEntry.count({
            where: { fiscalYearId: id, status: 'DRAFT' },
        });
        if (drafts > 0) {
            throw new common_1.BadRequestException(`Impossible de clôturer : ${drafts} écriture(s) encore en brouillon.`);
        }
        return this.prisma.fiscalYear.update({
            where: { id },
            data: { isClosed: true, isActive: false },
        });
    }
    async reopen(id, user) {
        const fy = await this.prisma.fiscalYear.findFirst({
            where: { id, subsidiaryId: user.subsidiaryId },
        });
        if (!fy)
            throw new common_1.NotFoundException('Exercice introuvable.');
        if (!fy.isClosed)
            throw new common_1.BadRequestException('Cet exercice est déjà ouvert.');
        return this.prisma.fiscalYear.update({
            where: { id },
            data: { isClosed: false, isActive: true },
        });
    }
};
exports.PeriodsService = PeriodsService;
exports.PeriodsService = PeriodsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PeriodsService);
//# sourceMappingURL=periods.service.js.map