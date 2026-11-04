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
var AllowanceRuleService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllowanceRuleService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
let AllowanceRuleService = AllowanceRuleService_1 = class AllowanceRuleService {
    prisma;
    logger = new common_1.Logger(AllowanceRuleService_1.name);
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
        const rule = await this.prisma.allowanceRule.create({
            data: {
                id: `allow_${Date.now()}_${Math.random()}`,
                payrollConfigId: config.id,
                ...dto,
            },
        });
        this.logger.warn(`[AUDIT] Allowance rule created for subsidiary ${subsidiaryId}: ${dto.name}. Created by: ${user?.email || 'unknown'}`);
        return rule;
    }
    async getByConfigId(configId) {
        return this.prisma.allowanceRule.findMany({
            where: { payrollConfigId: configId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getActiveRules(configId) {
        const now = new Date();
        return this.prisma.allowanceRule.findMany({
            where: {
                payrollConfigId: configId,
                isActive: true,
                effectiveDate: { lte: now },
                OR: [{ expiryDate: null }, { expiryDate: { gte: now } }],
            },
            orderBy: { name: 'asc' },
        });
    }
    async getApplicableAllowances(configId, employeeAge, salary, numberOfDependents) {
        const activeRules = await this.getActiveRules(configId);
        return activeRules.filter((rule) => {
            if (rule.minAge && employeeAge && employeeAge < rule.minAge)
                return false;
            if (rule.maxAge && employeeAge && employeeAge > rule.maxAge)
                return false;
            if (rule.minSalary && salary && salary < rule.minSalary.toNumber())
                return false;
            if (rule.numberOfDependents &&
                numberOfDependents &&
                numberOfDependents < rule.numberOfDependents)
                return false;
            return true;
        });
    }
    async calculateAllowances(configId, salary, employeeAge, numberOfDependents) {
        const applicableRules = await this.getApplicableAllowances(configId, employeeAge, salary, numberOfDependents);
        let totalAllowance = 0;
        const allowanceDetails = [];
        for (const rule of applicableRules) {
            let amount = 0;
            if (rule.amount) {
                amount = rule.amount.toNumber();
            }
            else if (rule.percentageOfSalary) {
                amount = (salary * rule.percentageOfSalary.toNumber()) / 100;
            }
            totalAllowance += amount;
            allowanceDetails.push({
                name: rule.name,
                amount,
            });
        }
        return { totalAllowance, details: allowanceDetails };
    }
    async update(ruleId, dto, user) {
        const rule = await this.prisma.allowanceRule.findUnique({
            where: { id: ruleId },
        });
        if (!rule) {
            throw new common_1.NotFoundException('Allowance rule not found');
        }
        const updated = await this.prisma.allowanceRule.update({
            where: { id: ruleId },
            data: dto,
        });
        this.logger.warn(`[AUDIT] Allowance rule updated: ${rule.name}. Updated by: ${user?.email || 'unknown'}`);
        return updated;
    }
    async delete(ruleId, user) {
        const rule = await this.prisma.allowanceRule.findUnique({
            where: { id: ruleId },
        });
        if (!rule) {
            throw new common_1.NotFoundException('Allowance rule not found');
        }
        await this.prisma.allowanceRule.delete({
            where: { id: ruleId },
        });
        this.logger.warn(`[AUDIT] Allowance rule deleted: ${rule.name}. Deleted by: ${user?.email || 'unknown'}`);
        return rule;
    }
    async deactivate(ruleId, user) {
        return this.update(ruleId, { isActive: false }, user);
    }
};
exports.AllowanceRuleService = AllowanceRuleService;
exports.AllowanceRuleService = AllowanceRuleService = AllowanceRuleService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AllowanceRuleService);
//# sourceMappingURL=allowance-rule.service.js.map