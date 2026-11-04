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
exports.TaxBracketController = void 0;
const common_1 = require("@nestjs/common");
const tax_bracket_service_1 = require("../services/tax-bracket.service");
const tax_bracket_dto_1 = require("../dto/tax-bracket.dto");
const jwt_guard_1 = require("../../common/auth/jwt/jwt.guard");
const role_guard_1 = require("../../common/auth/role/role.guard");
const role_decorator_1 = require("../../common/auth/role/role.decorator");
const client_1 = require("@prisma/client");
const configuration_access_service_1 = require("../services/configuration-access.service");
let TaxBracketController = class TaxBracketController {
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
    async getActiveBrackets(configId, user) {
        await this.access.assertConfigAccess(configId, user);
        return this.service.getActiveBrackets(configId);
    }
    async calculateTax(configId, user, grossSalary, deductions) {
        await this.access.assertConfigAccess(configId, user);
        return this.service.getTaxableIncome(parseFloat(grossSalary), configId, deductions ? parseFloat(deductions) : 0);
    }
    async update(bracketId, dto, user) {
        await this.access.assertTaxBracketAccess(bracketId, user);
        return this.service.update(bracketId, dto, user);
    }
    async delete(bracketId, user) {
        await this.access.assertTaxBracketAccess(bracketId, user);
        return this.service.delete(bracketId, user);
    }
};
exports.TaxBracketController = TaxBracketController;
__decorate([
    (0, common_1.Post)(':subsidiaryId'),
    __param(0, (0, common_1.Param)('subsidiaryId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, tax_bracket_dto_1.CreateTaxBracketDto, Object]),
    __metadata("design:returntype", Promise)
], TaxBracketController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('config/:configId'),
    __param(0, (0, common_1.Param)('configId')),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TaxBracketController.prototype, "getByConfigId", null);
__decorate([
    (0, common_1.Get)('config/:configId/active'),
    __param(0, (0, common_1.Param)('configId')),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TaxBracketController.prototype, "getActiveBrackets", null);
__decorate([
    (0, common_1.Get)('config/:configId/calculate-tax'),
    __param(0, (0, common_1.Param)('configId')),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)('grossSalary')),
    __param(3, (0, common_1.Query)('deductions')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Number, Number]),
    __metadata("design:returntype", Promise)
], TaxBracketController.prototype, "calculateTax", null);
__decorate([
    (0, common_1.Put)(':bracketId'),
    __param(0, (0, common_1.Param)('bracketId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, tax_bracket_dto_1.UpdateTaxBracketDto, Object]),
    __metadata("design:returntype", Promise)
], TaxBracketController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':bracketId'),
    __param(0, (0, common_1.Param)('bracketId')),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TaxBracketController.prototype, "delete", null);
exports.TaxBracketController = TaxBracketController = __decorate([
    (0, common_1.Controller)('configuration/tax-brackets'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.HR_MANAGER),
    __metadata("design:paramtypes", [tax_bracket_service_1.TaxBracketService,
        configuration_access_service_1.ConfigurationAccessService])
], TaxBracketController);
//# sourceMappingURL=tax-bracket.controller.js.map