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
exports.OpportunitiesController = void 0;
const common_1 = require("@nestjs/common");
const opportunities_service_1 = require("./opportunities.service");
const create_opportunity_dto_1 = require("./dto/create-opportunity.dto");
const update_opportunity_dto_1 = require("./dto/update-opportunity.dto");
const jwt_guard_1 = require("../../common/auth/jwt/jwt.guard");
const role_decorator_1 = require("../../common/auth/role/role.decorator");
const client_1 = require("@prisma/client");
const role_guard_1 = require("../../common/auth/role/role.guard");
const pagination_query_dto_1 = require("../../common/pagination/dto/pagination-query.dto");
let OpportunitiesController = class OpportunitiesController {
    opportunitiesService;
    constructor(opportunitiesService) {
        this.opportunitiesService = opportunitiesService;
    }
    create(createOpportunityDto, user) {
        return this.opportunitiesService.create(createOpportunityDto, user);
    }
    findAll(user, paginationQuery) {
        return this.opportunitiesService.findAll(user, paginationQuery);
    }
    findOne(id, user) {
        return this.opportunitiesService.findOne(id, user);
    }
    update(id, updateOpportunityDto, user) {
        return this.opportunitiesService.update(id, updateOpportunityDto, user);
    }
    remove(id, user) {
        return this.opportunitiesService.remove(id, user);
    }
};
exports.OpportunitiesController = OpportunitiesController;
__decorate([
    (0, common_1.Post)(),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.SECRETARY, client_1.UserRole.FINANCIAL_DIRECTOR),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_opportunity_dto_1.CreateOpportunityDto, Object]),
    __metadata("design:returntype", void 0)
], OpportunitiesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.SECRETARY, client_1.UserRole.FINANCIAL_DIRECTOR),
    __param(0, (0, role_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", void 0)
], OpportunitiesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.SECRETARY, client_1.UserRole.FINANCIAL_DIRECTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OpportunitiesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.SECRETARY, client_1.UserRole.FINANCIAL_DIRECTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_opportunity_dto_1.UpdateOpportunityDto, Object]),
    __metadata("design:returntype", void 0)
], OpportunitiesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.SECRETARY, client_1.UserRole.FINANCIAL_DIRECTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OpportunitiesController.prototype, "remove", null);
exports.OpportunitiesController = OpportunitiesController = __decorate([
    (0, common_1.Controller)('crm/opportunities'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    __metadata("design:paramtypes", [opportunities_service_1.OpportunitiesService])
], OpportunitiesController);
//# sourceMappingURL=opportunities.controller.js.map