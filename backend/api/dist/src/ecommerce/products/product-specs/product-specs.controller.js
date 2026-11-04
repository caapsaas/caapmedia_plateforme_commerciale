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
exports.ProductSpecsController = void 0;
const common_1 = require("@nestjs/common");
const product_specs_service_1 = require("./product-specs.service");
const jwt_guard_1 = require("../../../common/auth/jwt/jwt.guard");
const role_guard_1 = require("../../../common/auth/role/role.guard");
const role_decorator_1 = require("../../../common/auth/role/role.decorator");
const client_1 = require("@prisma/client");
const product_spec_dto_1 = require("./dto/product-spec.dto");
const BUILDER_ROLES = [client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN];
let ProductSpecsController = class ProductSpecsController {
    productSpecsService;
    constructor(productSpecsService) {
        this.productSpecsService = productSpecsService;
    }
    getFormDefinition(id) {
        return this.productSpecsService.getFormDefinition(id);
    }
    getBuilderStructure(id) {
        return this.productSpecsService.getBuilderStructure(id);
    }
    createGroup(id, dto) {
        return this.productSpecsService.createGroup(id, dto);
    }
    updateGroup(groupId, dto) {
        return this.productSpecsService.updateGroup(groupId, dto);
    }
    removeGroup(groupId) {
        return this.productSpecsService.removeGroup(groupId);
    }
    createSpecification(id, dto) {
        return this.productSpecsService.createSpecification(id, dto);
    }
    updateSpecification(specId, dto) {
        return this.productSpecsService.updateSpecification(specId, dto);
    }
    removeSpecification(specId) {
        return this.productSpecsService.removeSpecification(specId);
    }
    reorderSpecifications(id, dto) {
        return this.productSpecsService.reorderSpecifications(id, dto);
    }
};
exports.ProductSpecsController = ProductSpecsController;
__decorate([
    (0, common_1.Get)(':id/form-definition'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductSpecsController.prototype, "getFormDefinition", null);
__decorate([
    (0, common_1.Get)(':id/spec-structure'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(...BUILDER_ROLES),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductSpecsController.prototype, "getBuilderStructure", null);
__decorate([
    (0, common_1.Post)(':id/spec-groups'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(...BUILDER_ROLES),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, product_spec_dto_1.CreateSpecGroupDto]),
    __metadata("design:returntype", void 0)
], ProductSpecsController.prototype, "createGroup", null);
__decorate([
    (0, common_1.Patch)('spec-groups/:groupId'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(...BUILDER_ROLES),
    __param(0, (0, common_1.Param)('groupId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, product_spec_dto_1.UpdateSpecGroupDto]),
    __metadata("design:returntype", void 0)
], ProductSpecsController.prototype, "updateGroup", null);
__decorate([
    (0, common_1.Delete)('spec-groups/:groupId'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(...BUILDER_ROLES),
    __param(0, (0, common_1.Param)('groupId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductSpecsController.prototype, "removeGroup", null);
__decorate([
    (0, common_1.Post)(':id/specifications'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(...BUILDER_ROLES),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, product_spec_dto_1.CreateSpecificationDto]),
    __metadata("design:returntype", void 0)
], ProductSpecsController.prototype, "createSpecification", null);
__decorate([
    (0, common_1.Patch)('specifications/:specId'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(...BUILDER_ROLES),
    __param(0, (0, common_1.Param)('specId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, product_spec_dto_1.UpdateSpecificationDto]),
    __metadata("design:returntype", void 0)
], ProductSpecsController.prototype, "updateSpecification", null);
__decorate([
    (0, common_1.Delete)('specifications/:specId'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(...BUILDER_ROLES),
    __param(0, (0, common_1.Param)('specId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductSpecsController.prototype, "removeSpecification", null);
__decorate([
    (0, common_1.Patch)(':id/specifications/reorder'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(...BUILDER_ROLES),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, product_spec_dto_1.ReorderSpecificationsDto]),
    __metadata("design:returntype", void 0)
], ProductSpecsController.prototype, "reorderSpecifications", null);
exports.ProductSpecsController = ProductSpecsController = __decorate([
    (0, common_1.Controller)('products'),
    __metadata("design:paramtypes", [product_specs_service_1.ProductSpecsService])
], ProductSpecsController);
//# sourceMappingURL=product-specs.controller.js.map