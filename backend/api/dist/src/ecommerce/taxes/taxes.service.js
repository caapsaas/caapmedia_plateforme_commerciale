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
exports.TaxesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const client_1 = require("@prisma/client");
const generate_id_util_1 = require("../../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../../common/constants/id-prefixes.const");
let TaxesService = class TaxesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createTaxDto) {
        return this.prisma.$transaction(async (tx) => {
            if (createTaxDto.isDefault) {
                await tx.taxRate.updateMany({
                    where: { isDefault: true },
                    data: { isDefault: false },
                });
            }
            return tx.taxRate.create({
                data: {
                    id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.TAXRATE),
                    ...createTaxDto,
                    rate: new client_1.Prisma.Decimal(createTaxDto.rate),
                },
            });
        });
    }
    findAll() {
        return this.prisma.taxRate.findMany({
            orderBy: { taxRatesName: 'asc' },
        });
    }
    findOne(id) {
        return this.prisma.taxRate.findUniqueOrThrow({ where: { id } });
    }
    async update(id, updateTaxDto) {
        if (updateTaxDto.isDefault === false) {
            const currentTax = await this.prisma.taxRate.findUnique({
                where: { id },
            });
            if (currentTax?.isDefault) {
                throw new common_1.BadRequestException('Impossible de désactiver la taxe par défaut. Veuillez définir une autre taxe comme étant par défaut pour la remplacer.');
            }
        }
        return this.prisma.$transaction(async (tx) => {
            if (updateTaxDto.isDefault) {
                await tx.taxRate.updateMany({
                    where: { isDefault: true, NOT: { id } },
                    data: { isDefault: false },
                });
            }
            return tx.taxRate.update({
                where: { id },
                data: {
                    ...updateTaxDto,
                    ...(updateTaxDto.rate && {
                        rate: new client_1.Prisma.Decimal(updateTaxDto.rate),
                    }),
                },
            });
        });
    }
    async remove(id) {
        const tax = await this.findOne(id);
        if (tax.isDefault) {
            throw new common_1.BadRequestException('Impossible de supprimer la taxe par défaut.');
        }
        return this.prisma.taxRate.delete({ where: { id } });
    }
};
exports.TaxesService = TaxesService;
exports.TaxesService = TaxesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TaxesService);
//# sourceMappingURL=taxes.service.js.map