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
var TaxBracketService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaxBracketService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
let TaxBracketService = TaxBracketService_1 = class TaxBracketService {
    prisma;
    logger = new common_1.Logger(TaxBracketService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(subsidiaryId, dto, user) {
        const config = await this.prisma.payrollConfiguration.findUnique({
            where: { subsidiaryId },
        });
        if (!config) {
            throw new common_1.NotFoundException('Payroll configuration not found');
        }
        await this.validateNonOverlappingBrackets(config.id, dto);
        const bracket = await this.prisma.taxBracket.create({
            data: {
                id: `bracket_${Date.now()}_${Math.random()}`,
                payrollConfigId: config.id,
                ...dto,
            },
        });
        this.logger.warn(`[AUDIT] Tax bracket created for subsidiary ${subsidiaryId}: ${bracket.minSalary}-${bracket.maxSalary} @ ${bracket.rate}%. Created by: ${user?.email || 'unknown'}`);
        return bracket;
    }
    async getByConfigId(configId) {
        return this.prisma.taxBracket.findMany({
            where: { payrollConfigId: configId },
            orderBy: { minSalary: 'asc' },
        });
    }
    async getActiveBrackets(configId) {
        const now = new Date();
        return this.prisma.taxBracket.findMany({
            where: {
                payrollConfigId: configId,
                effectiveDate: { lte: now },
                OR: [{ expiryDate: null }, { expiryDate: { gte: now } }],
            },
            orderBy: { minSalary: 'asc' },
        });
    }
    async getTaxableIncome(grossSalary, configId, deductions = 0) {
        const brackets = await this.getActiveBrackets(configId);
        if (brackets.length === 0) {
            return { taxableIncome: 0, tax: 0 };
        }
        const taxableIncome = Math.max(0, grossSalary - deductions);
        let tax = 0;
        for (const bracket of brackets) {
            const minSalary = typeof bracket.minSalary === 'number'
                ? bracket.minSalary
                : bracket.minSalary.toNumber();
            if (taxableIncome <= minSalary) {
                break;
            }
            const maxSalary = bracket.maxSalary
                ? typeof bracket.maxSalary === 'number'
                    ? bracket.maxSalary
                    : bracket.maxSalary.toNumber()
                : Infinity;
            const rate = typeof bracket.rate === 'number'
                ? bracket.rate
                : bracket.rate.toNumber();
            const upperLimit = maxSalary;
            const taxableInBracket = Math.min(taxableIncome, upperLimit) - minSalary;
            if (taxableInBracket > 0) {
                const bracketTax = (taxableInBracket * rate) / 100;
                tax += bracketTax;
            }
        }
        return { taxableIncome, tax };
    }
    async update(bracketId, dto, user) {
        const bracket = await this.prisma.taxBracket.findUnique({
            where: { id: bracketId },
        });
        if (!bracket) {
            throw new common_1.NotFoundException('Tax bracket not found');
        }
        if (dto.minSalary || dto.maxSalary) {
            await this.validateNonOverlappingBrackets(bracket.payrollConfigId, dto, bracketId);
        }
        const updated = await this.prisma.taxBracket.update({
            where: { id: bracketId },
            data: dto,
        });
        this.logger.warn(`[AUDIT] Tax bracket updated: ${bracket.minSalary}-${bracket.maxSalary} @ ${bracket.rate}%. Updated by: ${user?.email || 'unknown'}`);
        return updated;
    }
    async delete(bracketId, user) {
        const bracket = await this.prisma.taxBracket.findUnique({
            where: { id: bracketId },
        });
        if (!bracket) {
            throw new common_1.NotFoundException('Tax bracket not found');
        }
        await this.prisma.taxBracket.delete({
            where: { id: bracketId },
        });
        this.logger.warn(`[AUDIT] Tax bracket deleted: ${bracket.minSalary}-${bracket.maxSalary} @ ${bracket.rate}%. Deleted by: ${user?.email || 'unknown'}`);
        return bracket;
    }
    async validateNonOverlappingBrackets(configId, dto, excludeId) {
        const existing = await this.prisma.taxBracket.findMany({
            where: {
                payrollConfigId: configId,
                id: excludeId ? { not: excludeId } : undefined,
                effectiveDate: { lte: dto.effectiveDate },
                OR: [{ expiryDate: null }, { expiryDate: { gte: dto.effectiveDate } }],
            },
        });
        for (const bracket of existing) {
            if (this.bracketsOverlap(bracket, dto)) {
                throw new common_1.BadRequestException('Tax brackets cannot overlap');
            }
        }
    }
    bracketsOverlap(bracket, dto) {
        const min1 = bracket.minSalary;
        const max1 = bracket.maxSalary || Infinity;
        const min2 = dto.minSalary;
        const max2 = dto.maxSalary || Infinity;
        return !(max1 <= min2 || max2 <= min1);
    }
};
exports.TaxBracketService = TaxBracketService;
exports.TaxBracketService = TaxBracketService = TaxBracketService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TaxBracketService);
//# sourceMappingURL=tax-bracket.service.js.map