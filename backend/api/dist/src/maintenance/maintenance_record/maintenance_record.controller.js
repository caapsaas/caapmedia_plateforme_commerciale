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
exports.MaintenanceRecordController = void 0;
const common_1 = require("@nestjs/common");
const maintenance_record_service_1 = require("./maintenance_record.service");
const create_maintenance_record_dto_1 = require("./dto/create-maintenance_record.dto");
const jwt_guard_1 = require("../../common/auth/jwt/jwt.guard");
const role_guard_1 = require("../../common/auth/role/role.guard");
const role_decorator_1 = require("../../common/auth/role/role.decorator");
const client_1 = require("@prisma/client");
let MaintenanceRecordController = class MaintenanceRecordController {
    service;
    constructor(service) {
        this.service = service;
    }
    create(createMaintenanceRecordDto) {
        return this.service.create(createMaintenanceRecordDto);
    }
    findAll(query) {
        return this.service.findAll(query);
    }
    search(dto) {
        return this.service.search(dto);
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    update(id, updateMaintenanceRecordDto) {
        return this.service.update(id, updateMaintenanceRecordDto);
    }
    remove(id) {
        return this.service.remove(id);
    }
};
exports.MaintenanceRecordController = MaintenanceRecordController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.PRODUCTION_DIRECTOR),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_maintenance_record_dto_1.CreateMaintenanceRecordDto]),
    __metadata("design:returntype", void 0)
], MaintenanceRecordController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.PRODUCTION_DIRECTOR),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_maintenance_record_dto_1.FindMaintenanceRecordsDto]),
    __metadata("design:returntype", void 0)
], MaintenanceRecordController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.PRODUCTION_DIRECTOR),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_maintenance_record_dto_1.SearchMaintenanceRecordDto]),
    __metadata("design:returntype", void 0)
], MaintenanceRecordController.prototype, "search", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.PRODUCTION_DIRECTOR),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MaintenanceRecordController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.PRODUCTION_DIRECTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_maintenance_record_dto_1.UpdateMaintenanceRecordDto]),
    __metadata("design:returntype", void 0)
], MaintenanceRecordController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.PRODUCTION_DIRECTOR),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MaintenanceRecordController.prototype, "remove", null);
exports.MaintenanceRecordController = MaintenanceRecordController = __decorate([
    (0, common_1.Controller)('maintenance-records'),
    __metadata("design:paramtypes", [maintenance_record_service_1.MaintenanceRecordService])
], MaintenanceRecordController);
//# sourceMappingURL=maintenance_record.controller.js.map