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
exports.BankService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const client_1 = require("@prisma/client");
const check_role_util_1 = require("../../common/auth/role/check-role.util");
const generate_id_util_1 = require("../../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../../common/constants/id-prefixes.const");
let BankService = class BankService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, user) {
        (0, check_role_util_1.checkRole)(user, [client_1.UserRole.ADMIN, client_1.UserRole.FINANCIAL_DIRECTOR], 'Permission denied to create banks.');
        const existing = await this.prisma.bank.findUnique({
            where: { name: dto.name },
        });
        if (existing) {
            throw new common_1.ConflictException(`Une banque nommée "${dto.name}" existe déjà.`);
        }
        return this.prisma.bank.create({
            data: { id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.BANK), ...dto },
        });
    }
    async findAll() {
        return this.prisma.bank.findMany({ orderBy: { name: 'asc' } });
    }
    async findOne(id) {
        const bank = await this.prisma.bank.findUnique({ where: { id } });
        if (!bank) {
            throw new common_1.NotFoundException(`Banque avec l'ID "${id}" introuvable.`);
        }
        return bank;
    }
    async update(id, dto, user) {
        (0, check_role_util_1.checkRole)(user, [client_1.UserRole.ADMIN, client_1.UserRole.FINANCIAL_DIRECTOR], 'Permission denied to update banks.');
        await this.findOne(id);
        if (dto.name) {
            const existing = await this.prisma.bank.findUnique({
                where: { name: dto.name },
            });
            if (existing && existing.id !== id) {
                throw new common_1.ConflictException(`Une banque nommée "${dto.name}" existe déjà.`);
            }
        }
        return this.prisma.bank.update({ where: { id }, data: dto });
    }
    async remove(id, user) {
        (0, check_role_util_1.checkRole)(user, [client_1.UserRole.ADMIN, client_1.UserRole.FINANCIAL_DIRECTOR], 'Permission denied to delete banks.');
        const bank = await this.prisma.bank.findUnique({
            where: { id },
            include: { _count: { select: { accounts: true } } },
        });
        if (!bank) {
            throw new common_1.NotFoundException(`Banque avec l'ID "${id}" introuvable.`);
        }
        if (bank._count.accounts > 0) {
            throw new common_1.BadRequestException(`Impossible de supprimer "${bank.name}" : ${bank._count.accounts} compte(s) de trésorerie la référencent encore.`);
        }
        return this.prisma.bank.delete({ where: { id } });
    }
};
exports.BankService = BankService;
exports.BankService = BankService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BankService);
//# sourceMappingURL=bank.service.js.map