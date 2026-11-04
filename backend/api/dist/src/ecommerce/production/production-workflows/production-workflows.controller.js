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
exports.ProductionWorkflowsController = void 0;
const common_1 = require("@nestjs/common");
const production_workflows_service_1 = require("./production-workflows.service");
const workflow_dto_1 = require("./dto/workflow.dto");
const jwt_guard_1 = require("../../../common/auth/jwt/jwt.guard");
const role_guard_1 = require("../../../common/auth/role/role.guard");
const role_decorator_1 = require("../../../common/auth/role/role.decorator");
const client_1 = require("@prisma/client");
let ProductionWorkflowsController = class ProductionWorkflowsController {
    service;
    constructor(service) {
        this.service = service;
    }
    create(dto) {
        return this.service.create(dto);
    }
    findAll(subsidiaryId) {
        return this.service.findAll(subsidiaryId);
    }
    resolve(itemId) {
        return this.service.resolve(itemId);
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    update(id, dto) {
        return this.service.update(id, dto);
    }
    remove(id) {
        return this.service.remove(id);
    }
};
exports.ProductionWorkflowsController = ProductionWorkflowsController;
__decorate([
    (0, common_1.Post)(),
    (0, role_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [workflow_dto_1.CreateWorkflowDto]),
    __metadata("design:returntype", void 0)
], ProductionWorkflowsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, role_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN),
    __param(0, (0, common_1.Query)('subsidiaryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductionWorkflowsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('resolve/:itemId'),
    (0, role_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.COMMERCIAL),
    __param(0, (0, common_1.Param)('itemId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductionWorkflowsController.prototype, "resolve", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, role_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductionWorkflowsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, role_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, workflow_dto_1.UpdateWorkflowDto]),
    __metadata("design:returntype", void 0)
], ProductionWorkflowsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, role_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductionWorkflowsController.prototype, "remove", null);
exports.ProductionWorkflowsController = ProductionWorkflowsController = __decorate([
    (0, common_1.Controller)('production/workflows'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    __metadata("design:paramtypes", [production_workflows_service_1.ProductionWorkflowsService])
], ProductionWorkflowsController);
//# sourceMappingURL=production-workflows.controller.js.map