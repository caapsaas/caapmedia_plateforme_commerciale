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
exports.EquipmentCostConfigController = void 0;
const common_1 = require("@nestjs/common");
const equipment_cost_config_service_1 = require("./equipment-cost-config.service");
const upsert_equipment_cost_dto_1 = require("./dto/upsert-equipment-cost.dto");
const jwt_guard_1 = require("../../../common/auth/jwt/jwt.guard");
const role_guard_1 = require("../../../common/auth/role/role.guard");
const role_decorator_1 = require("../../../common/auth/role/role.decorator");
const client_1 = require("@prisma/client");
let EquipmentCostConfigController = class EquipmentCostConfigController {
    service;
    constructor(service) {
        this.service = service;
    }
    upsert(dto, user) {
        return this.service.upsert(dto, user);
    }
    findAll(subsidiaryId, user) {
        return this.service.findAll(subsidiaryId, user);
    }
    findConfigured(subsidiaryId) {
        return this.service.findConfigured(subsidiaryId);
    }
    findOne(equipmentId) {
        return this.service.findOne(equipmentId);
    }
};
exports.EquipmentCostConfigController = EquipmentCostConfigController;
__decorate([
    (0, common_1.Post)(),
    (0, role_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [upsert_equipment_cost_dto_1.UpsertEquipmentCostDto, Object]),
    __metadata("design:returntype", void 0)
], EquipmentCostConfigController.prototype, "upsert", null);
__decorate([
    (0, common_1.Get)(),
    (0, role_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN),
    __param(0, (0, common_1.Query)('subsidiaryId')),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EquipmentCostConfigController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('configured'),
    (0, role_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.PRODUCTION_DIRECTOR, client_1.UserRole.FINANCIAL_DIRECTOR),
    __param(0, (0, common_1.Query)('subsidiaryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EquipmentCostConfigController.prototype, "findConfigured", null);
__decorate([
    (0, common_1.Get)(':equipmentId'),
    (0, role_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('equipmentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EquipmentCostConfigController.prototype, "findOne", null);
exports.EquipmentCostConfigController = EquipmentCostConfigController = __decorate([
    (0, common_1.Controller)('production/equipment-costs'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    __metadata("design:paramtypes", [equipment_cost_config_service_1.EquipmentCostConfigService])
], EquipmentCostConfigController);
//# sourceMappingURL=equipment-cost-config.controller.js.map