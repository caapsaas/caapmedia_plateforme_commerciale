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
exports.SalaryComponentController = void 0;
const common_1 = require("@nestjs/common");
const salary_component_service_1 = require("../services/salary-component.service");
const salary_component_dto_1 = require("../dto/salary-component.dto");
const jwt_guard_1 = require("../../common/auth/jwt/jwt.guard");
const role_guard_1 = require("../../common/auth/role/role.guard");
const role_decorator_1 = require("../../common/auth/role/role.decorator");
const client_1 = require("@prisma/client");
const configuration_access_service_1 = require("../services/configuration-access.service");
let SalaryComponentController = class SalaryComponentController {
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
    async getActiveByConfigId(configId, user) {
        await this.access.assertConfigAccess(configId, user);
        return this.service.getActiveByConfigId(configId);
    }
    async update(componentId, dto, user) {
        await this.access.assertSalaryComponentAccess(componentId, user);
        return this.service.update(componentId, dto, user);
    }
    async delete(componentId, user) {
        await this.access.assertSalaryComponentAccess(componentId, user);
        return this.service.delete(componentId, user);
    }
    async deactivate(componentId, user) {
        await this.access.assertSalaryComponentAccess(componentId, user);
        return this.service.deactivate(componentId, user);
    }
    async reorder(configId, components, user) {
        await this.access.assertConfigAccess(configId, user);
        await Promise.all(components.map(({ id }) => this.access.assertSalaryComponentAccess(id, user)));
        return this.service.reorder(components, user);
    }
};
exports.SalaryComponentController = SalaryComponentController;
__decorate([
    (0, common_1.Post)(':subsidiaryId'),
    __param(0, (0, common_1.Param)('subsidiaryId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, salary_component_dto_1.CreateSalaryComponentDto, Object]),
    __metadata("design:returntype", Promise)
], SalaryComponentController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('config/:configId'),
    __param(0, (0, common_1.Param)('configId')),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SalaryComponentController.prototype, "getByConfigId", null);
__decorate([
    (0, common_1.Get)('config/:configId/active'),
    __param(0, (0, common_1.Param)('configId')),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SalaryComponentController.prototype, "getActiveByConfigId", null);
__decorate([
    (0, common_1.Put)(':componentId'),
    __param(0, (0, common_1.Param)('componentId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, salary_component_dto_1.UpdateSalaryComponentDto, Object]),
    __metadata("design:returntype", Promise)
], SalaryComponentController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':componentId'),
    __param(0, (0, common_1.Param)('componentId')),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SalaryComponentController.prototype, "delete", null);
__decorate([
    (0, common_1.Put)(':componentId/deactivate'),
    __param(0, (0, common_1.Param)('componentId')),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SalaryComponentController.prototype, "deactivate", null);
__decorate([
    (0, common_1.Post)(':configId/reorder'),
    __param(0, (0, common_1.Param)('configId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, Object]),
    __metadata("design:returntype", Promise)
], SalaryComponentController.prototype, "reorder", null);
exports.SalaryComponentController = SalaryComponentController = __decorate([
    (0, common_1.Controller)('configuration/salary-components'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    __metadata("design:paramtypes", [salary_component_service_1.SalaryComponentService,
        configuration_access_service_1.ConfigurationAccessService])
], SalaryComponentController);
//# sourceMappingURL=salary-component.controller.js.map