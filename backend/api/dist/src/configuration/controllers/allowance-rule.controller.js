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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllowanceRuleController = void 0;
const common_1 = require("@nestjs/common");
const allowance_rule_service_1 = require("../services/allowance-rule.service");
const allowance_rule_dto_1 = require("../dto/allowance-rule.dto");
const jwt_guard_1 = require("../../common/auth/jwt/jwt.guard");
const role_guard_1 = require("../../common/auth/role/role.guard");
const role_decorator_1 = require("../../common/auth/role/role.decorator");
const client_1 = require("@prisma/client");
const configuration_access_service_1 = require("../services/configuration-access.service");
let AllowanceRuleController = class AllowanceRuleController {
    service;
    access;
    constructor(service, access) {
        this.service = service;
        this.access = access;
    }
    async create(subsidiaryId, dto, user) {
        await this.access.assertSubsidiaryConfigAccess(subsidiaryId, user);
        return this.service.create(subsidiaryId, dto, user);
    }
    async getByConfigId(configId, user) {
        await this.access.assertConfigAccess(configId, user);
        return this.service.getByConfigId(configId);
    }
    async getActiveRules(configId, user) {
        await this.access.assertConfigAccess(configId, user);
        return this.service.getActiveRules(configId);
    }
    async getApplicableAllowances(configId, user, age, salary, dependents) {
        await this.access.assertConfigAccess(configId, user);
        return this.service.getApplicableAllowances(configId, age ? parseInt(age) : undefined, salary ? parseFloat(salary) : undefined, dependents ? parseInt(dependents) : undefined);
    }
    async calculateAllowances(configId, user, salary, age, dependents) {
        await this.access.assertConfigAccess(configId, user);
        return this.service.calculateAllowances(configId, parseFloat(salary), age ? parseInt(age) : undefined, dependents ? parseInt(dependents) : undefined);
    }
    async update(ruleId, dto, user) {
        await this.access.assertAllowanceRuleAccess(ruleId, user);
        return this.service.update(ruleId, dto, user);
    }
    async delete(ruleId, user) {
        await this.access.assertAllowanceRuleAccess(ruleId, user);
        return this.service.delete(ruleId, user);
    }
    async deactivate(ruleId, user) {
        await this.access.assertAllowanceRuleAccess(ruleId, user);
        return this.service.deactivate(ruleId, user);
    }
};
exports.AllowanceRuleController = AllowanceRuleController;
__decorate([
    (0, common_1.Post)(':subsidiaryId'),
    __param(0, (0, common_1.Param)('subsidiaryId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, allowance_rule_dto_1.CreateAllowanceRuleDto, Object]),
    __metadata("design:returntype", Promise)
], AllowanceRuleController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('config/:configId'),
    __param(0, (0, common_1.Param)('configId')),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AllowanceRuleController.prototype, "getByConfigId", null);
__decorate([
    (0, common_1.Get)('config/:configId/active'),
    __param(0, (0, common_1.Param)('configId')),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AllowanceRuleController.prototype, "getActiveRules", null);
__decorate([
    (0, common_1.Get)('config/:configId/applicable'),
    __param(0, (0, common_1.Param)('configId')),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)('age')),
    __param(3, (0, common_1.Query)('salary')),
    __param(4, (0, common_1.Query)('dependents')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Number, Number, Number]),
    __metadata("design:returntype", Promise)
], AllowanceRuleController.prototype, "getApplicableAllowances", null);
__decorate([
    (0, common_1.Get)('config/:configId/calculate'),
    __param(0, (0, common_1.Param)('configId')),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)('salary')),
    __param(3, (0, common_1.Query)('age')),
    __param(4, (0, common_1.Query)('dependents')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Number, Number, Number]),
    __metadata("design:returntype", Promise)
], AllowanceRuleController.prototype, "calculateAllowances", null);
__decorate([
    (0, common_1.Put)(':ruleId'),
    __param(0, (0, common_1.Param)('ruleId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, allowance_rule_dto_1.UpdateAllowanceRuleDto, Object]),
    __metadata("design:returntype", Promise)
], AllowanceRuleController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':ruleId'),
    __param(0, (0, common_1.Param)('ruleId')),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AllowanceRuleController.prototype, "delete", null);
__decorate([
    (0, common_1.Put)(':ruleId/deactivate'),
    __param(0, (0, common_1.Param)('ruleId')),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AllowanceRuleController.prototype, "deactivate", null);
exports.AllowanceRuleController = AllowanceRuleController = __decorate([
    (0, common_1.Controller)('configuration/allowance-rules'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    __metadata("design:paramtypes", [allowance_rule_service_1.AllowanceRuleService,
        configuration_access_service_1.ConfigurationAccessService])
], AllowanceRuleController);
//# sourceMappingURL=allowance-rule.controller.js.map