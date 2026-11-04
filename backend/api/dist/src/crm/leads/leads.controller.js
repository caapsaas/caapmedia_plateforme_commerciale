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
exports.LeadsController = void 0;
const common_1 = require("@nestjs/common");
const leads_service_1 = require("./leads.service");
const create_lead_dto_1 = require("./dto/create-lead.dto");
const public_quote_request_dto_1 = require("./dto/public-quote-request.dto");
const update_lead_dto_1 = require("./dto/update-lead.dto");
const jwt_guard_1 = require("../../common/auth/jwt/jwt.guard");
const role_decorator_1 = require("../../common/auth/role/role.decorator");
const client_1 = require("@prisma/client");
const role_guard_1 = require("../../common/auth/role/role.guard");
const pagination_query_dto_1 = require("../../common/pagination/dto/pagination-query.dto");
let LeadsController = class LeadsController {
    leadsService;
    constructor(leadsService) {
        this.leadsService = leadsService;
    }
    createPublicQuoteRequest(publicQuoteRequestDto) {
        return this.leadsService.createPublicLead(publicQuoteRequestDto);
    }
    create(createLeadDto, user) {
        return this.leadsService.create(createLeadDto, user);
    }
    findAll(user, paginationQuery, filterSubsidiaryId, filterSalesRepId) {
        return this.leadsService.findAll(user, paginationQuery, filterSubsidiaryId, filterSalesRepId);
    }
    findOne(id, user) {
        return this.leadsService.findOne(id);
    }
    update(id, updateLeadDto, user) {
        return this.leadsService.update(id, updateLeadDto);
    }
    remove(id, user) {
        return this.leadsService.remove(id);
    }
    convert(id, user) {
        return this.leadsService.convert(id, user);
    }
};
exports.LeadsController = LeadsController;
__decorate([
    (0, common_1.Post)('quote-request'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [public_quote_request_dto_1.PublicQuoteRequestDto]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "createPublicQuoteRequest", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, common_1.Post)(),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.SECRETARY, client_1.UserRole.FINANCIAL_DIRECTOR),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_lead_dto_1.CreateLeadDto, Object]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, common_1.Get)(),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.SECRETARY, client_1.UserRole.FINANCIAL_DIRECTOR),
    __param(0, (0, role_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Query)('subsidiaryId')),
    __param(3, (0, common_1.Query)('salesRepId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pagination_query_dto_1.PaginationQueryDto, String, String]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "findAll", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, common_1.Get)(':id'),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.SECRETARY, client_1.UserRole.FINANCIAL_DIRECTOR),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "findOne", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, common_1.Patch)(':id'),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.SECRETARY, client_1.UserRole.FINANCIAL_DIRECTOR),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_lead_dto_1.UpdateLeadDto, Object]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "update", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, common_1.Delete)(':id'),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.SECRETARY, client_1.UserRole.FINANCIAL_DIRECTOR),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "remove", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, common_1.Post)(':id/convert'),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.SECRETARY, client_1.UserRole.FINANCIAL_DIRECTOR),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "convert", null);
exports.LeadsController = LeadsController = __decorate([
    (0, common_1.Controller)('crm/leads'),
    __metadata("design:paramtypes", [leads_service_1.LeadsService])
], LeadsController);
//# sourceMappingURL=leads.controller.js.map