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
exports.SpecReferenceListsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../common/utils/prisma/prisma.service");
const generate_id_util_1 = require("../../../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../../../common/constants/id-prefixes.const");
let SpecReferenceListsService = class SpecReferenceListsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const existing = await this.prisma.specReferenceList.findUnique({
            where: { key: dto.key },
        });
        if (existing) {
            throw new common_1.BadRequestException(`Un référentiel avec la clé "${dto.key}" existe déjà.`);
        }
        return this.prisma.specReferenceList.create({
            data: { id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.SPECREFERENCELIST), ...dto },
        });
    }
    findAll() {
        return this.prisma.specReferenceList.findMany({
            include: { values: { orderBy: { order: 'asc' } } },
            orderBy: { name: 'asc' },
        });
    }
    async findOne(id) {
        const list = await this.prisma.specReferenceList.findUnique({
            where: { id },
            include: { values: { orderBy: { order: 'asc' } } },
        });
        if (!list) {
            throw new common_1.NotFoundException(`Référentiel avec l'ID "${id}" non trouvé`);
        }
        return list;
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.specReferenceList.update({ where: { id }, data: dto });
    }
    async remove(id) {
        await this.findOne(id);
        await this.prisma.specReferenceList.delete({ where: { id } });
        return { id };
    }
    async addValue(listId, dto) {
        await this.findOne(listId);
        const order = dto.order ??
            (await this.prisma.specReferenceValue.count({ where: { listId } })) + 1;
        return this.prisma.specReferenceValue.create({
            data: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.SPECREFERENCEVALUE),
                listId,
                value: dto.value,
                label: dto.label,
                order,
            },
        });
    }
    async updateValue(valueId, dto) {
        await this.findValueOrThrow(valueId);
        return this.prisma.specReferenceValue.update({
            where: { id: valueId },
            data: dto,
        });
    }
    async removeValue(valueId) {
        await this.findValueOrThrow(valueId);
        await this.prisma.specReferenceValue.delete({ where: { id: valueId } });
        return { id: valueId };
    }
    async findValueOrThrow(valueId) {
        const value = await this.prisma.specReferenceValue.findUnique({
            where: { id: valueId },
        });
        if (!value) {
            throw new common_1.NotFoundException(`Valeur de référentiel avec l'ID "${valueId}" non trouvée`);
        }
        return value;
    }
};
exports.SpecReferenceListsService = SpecReferenceListsService;
exports.SpecReferenceListsService = SpecReferenceListsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SpecReferenceListsService);
//# sourceMappingURL=spec-reference-lists.service.js.map