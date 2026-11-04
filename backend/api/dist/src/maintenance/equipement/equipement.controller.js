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
exports.EquipementController = void 0;
const common_1 = require("@nestjs/common");
const jwt_guard_1 = require("../../common/auth/jwt/jwt.guard");
const role_guard_1 = require("../../common/auth/role/role.guard");
const role_decorator_1 = require("../../common/auth/role/role.decorator");
const client_1 = require("@prisma/client");
const equipement_service_1 = require("./equipement.service");
const create_equipement_dto_1 = require("./dto/create-equipement.dto");
const BASE_ROLES = [
    client_1.UserRole.SUPER_ADMIN,
    client_1.UserRole.ADMIN,
    client_1.UserRole.PRODUCTION_DIRECTOR,
    client_1.UserRole.FINANCIAL_DIRECTOR,
];
let EquipementController = class EquipementController {
    equipementService;
    constructor(equipementService) {
        this.equipementService = equipementService;
    }
    create(createEquipementDto, user) {
        return this.equipementService.create(createEquipementDto, user);
    }
    findAll(user, subsidiaryId) {
        return this.equipementService.findAll(user, subsidiaryId);
    }
    search(query, user) {
        return this.equipementService.search(query, user);
    }
    findOne(id, user) {
        return this.equipementService.findOne(id, user);
    }
    update(id, updateEquipementDto, user) {
        return this.equipementService.update(id, updateEquipementDto, user);
    }
    remove(id, user) {
        return this.equipementService.remove(id, user);
    }
};
exports.EquipementController = EquipementController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_equipement_dto_1.CreateEquipmentDto, Object]),
    __metadata("design:returntype", void 0)
], EquipementController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, role_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('subsidiaryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], EquipementController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_equipement_dto_1.SearchEquipmentDto, Object]),
    __metadata("design:returntype", void 0)
], EquipementController.prototype, "search", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', new common_1.ParseUUIDPipe())),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EquipementController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_equipement_dto_1.UpdateEquipmentDto, Object]),
    __metadata("design:returntype", void 0)
], EquipementController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', new common_1.ParseUUIDPipe())),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EquipementController.prototype, "remove", null);
exports.EquipementController = EquipementController = __decorate([
    (0, common_1.Controller)('equipements'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(...BASE_ROLES),
    __metadata("design:paramtypes", [equipement_service_1.EquipementService])
], EquipementController);
//# sourceMappingURL=equipement.controller.js.map