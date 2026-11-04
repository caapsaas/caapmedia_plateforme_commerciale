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
exports.PreHireTrainingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_guard_1 = require("../../common/auth/jwt/jwt.guard");
const role_guard_1 = require("../../common/auth/role/role.guard");
const role_decorator_1 = require("../../common/auth/role/role.decorator");
const subsidiary_scope_1 = require("../../common/utils/subsidiary-scope");
const pre_hire_training_dto_1 = require("./dto/pre-hire-training.dto");
const pre_hire_training_service_1 = require("./pre-hire-training.service");
const employee_dto_1 = require("../employee/dto/employee.dto");
const HR_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'PRE_HIRE_MANAGER'];
let PreHireTrainingController = class PreHireTrainingController {
    service;
    constructor(service) {
        this.service = service;
    }
    async findAll(req, requestedSubsidiaryId) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        return this.service.findAll((0, subsidiary_scope_1.resolveEffectiveSubsidiaryId)(ctx, requestedSubsidiaryId));
    }
    create(dto, req) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        const subsidiaryId = (0, subsidiary_scope_1.resolveEffectiveSubsidiaryId)(ctx, dto.subsidiaryId);
        if (!subsidiaryId)
            throw new common_1.BadRequestException('Une filiale doit être sélectionnée.');
        return this.service.create(dto, subsidiaryId);
    }
    async findOne(id, req) {
        const item = await this.service.findOne(id);
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(item.subsidiaryId, (0, subsidiary_scope_1.resolveScopeContext)(req.user));
        return item;
    }
    async update(id, dto, req) {
        const activeRole = req.user?.activeRole || req.user?.role || req.user?.userRole;
        const submitsResults = Object.prototype.hasOwnProperty.call(dto, 'acquiredClients') ||
            Object.prototype.hasOwnProperty.call(dto, 'acquiredProspects');
        if (submitsResults && activeRole !== 'PRE_HIRE_MANAGER' && activeRole !== 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('Seul le responsable pré-embauche peut renseigner les résultats commerciaux.');
        }
        const item = await this.service.findOne(id);
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(item.subsidiaryId, (0, subsidiary_scope_1.resolveScopeContext)(req.user));
        return this.service.update(id, dto);
    }
    async remove(id, req) {
        const item = await this.service.findOne(id);
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(item.subsidiaryId, (0, subsidiary_scope_1.resolveScopeContext)(req.user));
        return this.service.remove(id);
    }
    async convertToEmployee(id, dto, req) {
        const candidate = await this.service.findOne(id);
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(candidate.subsidiaryId, (0, subsidiary_scope_1.resolveScopeContext)(req.user));
        return this.service.convertToEmployee(id, dto);
    }
};
exports.PreHireTrainingController = PreHireTrainingController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('subsidiaryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PreHireTrainingController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, role_decorator_1.Roles)('PRE_HIRE_MANAGER'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pre_hire_training_dto_1.CreatePreHireTrainingDto, Object]),
    __metadata("design:returntype", void 0)
], PreHireTrainingController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PreHireTrainingController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pre_hire_training_dto_1.UpdatePreHireTrainingDto, Object]),
    __metadata("design:returntype", Promise)
], PreHireTrainingController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PreHireTrainingController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/convert'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, employee_dto_1.CreateEmployeeDto, Object]),
    __metadata("design:returntype", Promise)
], PreHireTrainingController.prototype, "convertToEmployee", null);
exports.PreHireTrainingController = PreHireTrainingController = __decorate([
    (0, swagger_1.ApiTags)('Pre-hire training'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('hr/pre-hire-training'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(...HR_ROLES),
    __metadata("design:paramtypes", [pre_hire_training_service_1.PreHireTrainingService])
], PreHireTrainingController);
//# sourceMappingURL=pre-hire-training.controller.js.map