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
exports.UnitsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const generate_id_util_1 = require("../../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../../common/constants/id-prefixes.const");
let UnitsService = class UnitsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll() {
        return this.prisma.unit.findMany({ orderBy: { name: 'asc' } });
    }
    async findOne(id) {
        const unit = await this.prisma.unit.findUnique({ where: { id } });
        if (!unit) {
            throw new common_1.NotFoundException(`Unité avec l'ID "${id}" non trouvée`);
        }
        return unit;
    }
    create(dto) {
        return this.prisma.unit.create({
            data: { id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.UNIT), ...dto },
        });
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.unit.update({ where: { id }, data: dto });
    }
    async remove(id) {
        await this.findOne(id);
        try {
            await this.prisma.unit.delete({ where: { id } });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2003') {
                throw new common_1.BadRequestException('Cette unité est utilisée par au moins un produit de stock et ne peut pas être supprimée.');
            }
            throw error;
        }
        return { id };
    }
};
exports.UnitsService = UnitsService;
exports.UnitsService = UnitsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UnitsService);
//# sourceMappingURL=units.service.js.map