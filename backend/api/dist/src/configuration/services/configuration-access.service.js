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
exports.ConfigurationAccessService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
let ConfigurationAccessService = class ConfigurationAccessService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    assertSubsidiaryAccess(user, subsidiaryId) {
        const isGlobalAdmin = user.role === client_1.UserRole.ADMIN ||
            user.activeRole === client_1.UserRole.SUPER_ADMIN ||
            user.roles?.includes(client_1.UserRole.SUPER_ADMIN);
        if (!isGlobalAdmin && user.subsidiaryId !== subsidiaryId) {
            throw new common_1.ForbiddenException("Vous n'avez pas accès à cette filiale");
        }
    }
    async assertConfigAccess(configId, user) {
        const config = await this.prisma.payrollConfiguration.findUnique({
            where: { id: configId },
            select: { subsidiaryId: true },
        });
        if (!config)
            throw new common_1.NotFoundException('Payroll configuration not found');
        this.assertSubsidiaryAccess(user, config.subsidiaryId);
    }
    async assertSubsidiaryConfigAccess(subsidiaryId, user) {
        this.assertSubsidiaryAccess(user, subsidiaryId);
    }
    async assertTaxBracketAccess(bracketId, user) {
        const bracket = await this.prisma.taxBracket.findUnique({
            where: { id: bracketId },
            select: { payrollConfig: { select: { subsidiaryId: true } } },
        });
        if (!bracket)
            throw new common_1.NotFoundException('Tax bracket not found');
        this.assertSubsidiaryAccess(user, bracket.payrollConfig.subsidiaryId);
    }
    async assertSalaryComponentAccess(componentId, user) {
        const component = await this.prisma.salaryComponent.findUnique({
            where: { id: componentId },
            select: { payrollConfig: { select: { subsidiaryId: true } } },
        });
        if (!component)
            throw new common_1.NotFoundException('Salary component not found');
        this.assertSubsidiaryAccess(user, component.payrollConfig.subsidiaryId);
    }
    async assertAllowanceRuleAccess(ruleId, user) {
        const rule = await this.prisma.allowanceRule.findUnique({
            where: { id: ruleId },
            select: { payrollConfig: { select: { subsidiaryId: true } } },
        });
        if (!rule)
            throw new common_1.NotFoundException('Allowance rule not found');
        this.assertSubsidiaryAccess(user, rule.payrollConfig.subsidiaryId);
    }
};
exports.ConfigurationAccessService = ConfigurationAccessService;
exports.ConfigurationAccessService = ConfigurationAccessService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ConfigurationAccessService);
//# sourceMappingURL=configuration-access.service.js.map