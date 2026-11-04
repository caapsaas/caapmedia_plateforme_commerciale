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
var PayrollConfigurationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollConfigurationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
let PayrollConfigurationService = PayrollConfigurationService_1 = class PayrollConfigurationService {
    prisma;
    logger = new common_1.Logger(PayrollConfigurationService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOrCreateBySubsidiary(subsidiaryId) {
        let config = await this.prisma.payrollConfiguration.findUnique({
            where: { subsidiaryId },
            include: {
                salaryComponents: {
                    where: { isActive: true },
                    orderBy: { displayOrder: 'asc' },
                },
                taxBrackets: {
                    where: {
                        effectiveDate: { lte: new Date() },
                        OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }],
                    },
                    orderBy: { minSalary: 'asc' },
                },
                allowanceRules: {
                    where: {
                        isActive: true,
                        effectiveDate: { lte: new Date() },
                        OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }],
                    },
                },
            },
        });
        if (!config) {
            config = await this.createDefaultConfiguration(subsidiaryId);
        }
        return config;
    }
    async createDefaultConfiguration(subsidiaryId) {
        const now = new Date();
        const config = await this.prisma.payrollConfiguration.create({
            data: {
                id: `config_${subsidiaryId}_${Date.now()}`,
                subsidiaryId,
                minWage: 60000,
                minWagePeriod: 'monthly',
                minWageEffectiveDate: now,
                cnpsEmployeeRate: 0.042,
                cnpsEmployerRate: 0.042,
                cfcEmployeeRate: 0.01,
                cfcEmployerRate: 0.015,
                fneRate: 0.01,
                cnpsCap: 750000,
                professionalExpenseRate: 0.3,
                fixedAbatementAnnual: 500000,
                riskGroupARate: 0.0175,
                riskGroupBRate: 0.025,
                riskGroupCRate: 0.05,
            },
            include: {
                salaryComponents: true,
                taxBrackets: true,
                allowanceRules: true,
            },
        });
        await this.createDefaultComponents(config.id);
        await this.createDefaultTaxBrackets(config.id);
        return this.getOrCreateBySubsidiary(subsidiaryId);
    }
    async createDefaultComponents(configId) {
        const components = [
            {
                name: 'Salaire de Base',
                description: 'Salaire mensuel de base',
                type: 'EARNING',
                displayOrder: 1,
            },
            {
                name: 'CNPS Pension Employé',
                description: 'Pension vieillesse, invalidité et décès (4,2%)',
                type: 'CONTRIBUTION',
                rate: 4.2,
                contributionType: 'EMPLOYEE',
                displayOrder: 2,
            },
            {
                name: 'CNPS Pension Employeur',
                description: 'Pension vieillesse, invalidité et décès (4,2%)',
                type: 'CONTRIBUTION',
                rate: 4.2,
                contributionType: 'EMPLOYER',
                displayOrder: 3,
            },
            {
                name: 'IRC',
                description: 'Impôt sur les revenus',
                type: 'TAX',
                displayOrder: 4,
            },
            {
                name: 'Allocations Familiales',
                description: 'Allocations familiales',
                type: 'EARNING',
                displayOrder: 5,
            },
        ];
        for (const component of components) {
            await this.prisma.salaryComponent.create({
                data: {
                    id: `comp_${Date.now()}_${Math.random()}`,
                    payrollConfigId: configId,
                    ...component,
                    isActive: true,
                },
            });
        }
    }
    async createDefaultTaxBrackets(configId) {
        const now = new Date();
        const brackets = [
            { minSalary: 0, maxSalary: 2_000_000, rate: 0.1, deductible: 0 },
            { minSalary: 2_000_001, maxSalary: 3_000_000, rate: 0.15, deductible: 0 },
            { minSalary: 3_000_001, maxSalary: 5_000_000, rate: 0.25, deductible: 0 },
            { minSalary: 5_000_001, maxSalary: null, rate: 0.35, deductible: 0 },
        ];
        for (const bracket of brackets) {
            await this.prisma.taxBracket.create({
                data: {
                    id: `bracket_${Date.now()}_${Math.random()}`,
                    payrollConfigId: configId,
                    minSalary: bracket.minSalary,
                    maxSalary: bracket.maxSalary,
                    rate: bracket.rate,
                    deductible: bracket.deductible,
                    effectiveDate: now,
                    expiryDate: null,
                },
            });
        }
    }
    async updateConfiguration(subsidiaryId, dto, user) {
        const config = await this.prisma.payrollConfiguration.findUnique({
            where: { subsidiaryId },
        });
        if (!config) {
            throw new common_1.NotFoundException('Configuration not found');
        }
        const oldValues = {
            minWage: config.minWage,
            minWageEffectiveDate: config.minWageEffectiveDate,
            cnpsEmployeeRate: config.cnpsEmployeeRate,
            cnpsEmployerRate: config.cnpsEmployerRate,
            cfcEmployeeRate: config.cfcEmployeeRate,
            cfcEmployerRate: config.cfcEmployerRate,
            fneRate: config.fneRate,
            cnpsCap: config.cnpsCap,
            professionalExpenseRate: config.professionalExpenseRate,
            fixedAbatementAnnual: config.fixedAbatementAnnual,
            riskGroupARate: config.riskGroupARate,
            riskGroupBRate: config.riskGroupBRate,
            riskGroupCRate: config.riskGroupCRate,
        };
        const updateData = {
            minWage: dto.minWage ?? config.minWage,
            minWageEffectiveDate: dto.minWageEffectiveDate
                ? new Date(dto.minWageEffectiveDate)
                : config.minWageEffectiveDate,
            cnpsEmployeeRate: dto.cnpsEmployeeRate ?? config.cnpsEmployeeRate,
            cnpsEmployerRate: dto.cnpsEmployerRate ?? config.cnpsEmployerRate,
            cfcEmployeeRate: dto.cfcEmployeeRate ?? config.cfcEmployeeRate,
            cfcEmployerRate: dto.cfcEmployerRate ?? config.cfcEmployerRate,
            fneRate: dto.fneRate ?? config.fneRate,
            cnpsCap: dto.cnpsCap ?? config.cnpsCap,
            professionalExpenseRate: dto.professionalExpenseRate ?? config.professionalExpenseRate,
            fixedAbatementAnnual: dto.fixedAbatementAnnual ?? config.fixedAbatementAnnual,
            riskGroupARate: dto.riskGroupARate ?? config.riskGroupARate,
            riskGroupBRate: dto.riskGroupBRate ?? config.riskGroupBRate,
            riskGroupCRate: dto.riskGroupCRate ?? config.riskGroupCRate,
        };
        if (dto.irppBrackets) {
            updateData.taxBrackets = {
                deleteMany: { payrollConfigId: config.id },
                create: dto.irppBrackets.map((bracket) => ({
                    id: `bracket_${Date.now()}_${Math.random()}`,
                    minSalary: bracket.minSalary,
                    maxSalary: bracket.maxSalary,
                    rate: bracket.rate,
                    deductible: bracket.deductible,
                    effectiveDate: new Date(),
                    expiryDate: null,
                })),
            };
        }
        if (dto.leaveEntitlements) {
            updateData.leaveEntitlements = {
                deleteMany: { payrollConfigId: config.id },
                create: dto.leaveEntitlements.map((entitlement) => ({
                    id: `entitlement_${Date.now()}_${Math.random()}`,
                    type: entitlement.type,
                    daysPerYear: entitlement.daysPerYear,
                    isPaid: entitlement.isPaid,
                    description: entitlement.description,
                })),
            };
        }
        const updated = await this.prisma.payrollConfiguration.update({
            where: { subsidiaryId },
            data: updateData,
            include: {
                salaryComponents: { where: { isActive: true } },
                taxBrackets: { orderBy: { minSalary: 'asc' } },
                allowanceRules: true,
                leaveEntitlements: true,
            },
        });
        const changes = Object.entries(dto)
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => `${key}: ${oldValues[key]} → ${value}`)
            .join(', ');
        this.logger.warn(`[AUDIT] Payroll configuration updated for subsidiary ${subsidiaryId}. Changes: ${changes}. Modified by: ${user?.email || 'unknown'}`, 'PayrollConfigurationService');
        return updated;
    }
    async getConfiguration(subsidiaryId) {
        return this.getOrCreateBySubsidiary(subsidiaryId);
    }
};
exports.PayrollConfigurationService = PayrollConfigurationService;
exports.PayrollConfigurationService = PayrollConfigurationService = PayrollConfigurationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PayrollConfigurationService);
//# sourceMappingURL=payroll-configuration.service.js.map