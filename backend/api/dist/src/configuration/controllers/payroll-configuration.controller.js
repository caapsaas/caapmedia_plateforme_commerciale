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
exports.PayrollConfigurationController = void 0;
const common_1 = require("@nestjs/common");
const payroll_configuration_service_1 = require("../services/payroll-configuration.service");
const payroll_configuration_dto_1 = require("../dto/payroll-configuration.dto");
const jwt_guard_1 = require("../../common/auth/jwt/jwt.guard");
const role_guard_1 = require("../../common/auth/role/role.guard");
const role_decorator_1 = require("../../common/auth/role/role.decorator");
const client_1 = require("@prisma/client");
const configuration_access_service_1 = require("../services/configuration-access.service");
let PayrollConfigurationController = class PayrollConfigurationController {
    service;
    access;
    constructor(service, access) {
        this.service = service;
        this.access = access;
    }
    async getConfigurationFull(subsidiaryId, user) {
        await this.access.assertSubsidiaryConfigAccess(subsidiaryId, user);
        return this.service.getOrCreateBySubsidiary(subsidiaryId);
    }
    async getConfiguration(subsidiaryId, user) {
        await this.access.assertSubsidiaryConfigAccess(subsidiaryId, user);
        return this.service.getConfiguration(subsidiaryId);
    }
    async updateConfiguration(subsidiaryId, dto, user) {
        await this.access.assertSubsidiaryConfigAccess(subsidiaryId, user);
        return this.service.updateConfiguration(subsidiaryId, dto, user);
    }
};
exports.PayrollConfigurationController = PayrollConfigurationController;
__decorate([
    (0, common_1.Get)(':subsidiaryId/full'),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    __param(0, (0, common_1.Param)('subsidiaryId')),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PayrollConfigurationController.prototype, "getConfigurationFull", null);
__decorate([
    (0, common_1.Get)(':subsidiaryId'),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    __param(0, (0, common_1.Param)('subsidiaryId')),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PayrollConfigurationController.prototype, "getConfiguration", null);
__decorate([
    (0, common_1.Put)(':subsidiaryId'),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    __param(0, (0, common_1.Param)('subsidiaryId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, payroll_configuration_dto_1.UpdatePayrollConfigDto, Object]),
    __metadata("design:returntype", Promise)
], PayrollConfigurationController.prototype, "updateConfiguration", null);
exports.PayrollConfigurationController = PayrollConfigurationController = __decorate([
    (0, common_1.Controller)('configuration/payroll'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    __metadata("design:paramtypes", [payroll_configuration_service_1.PayrollConfigurationService,
        configuration_access_service_1.ConfigurationAccessService])
], PayrollConfigurationController);
//# sourceMappingURL=payroll-configuration.controller.js.map