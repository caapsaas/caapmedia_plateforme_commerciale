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
exports.IncomestatementController = void 0;
const common_1 = require("@nestjs/common");
const incomestatement_service_1 = require("./incomestatement.service");
const jwt_guard_1 = require("../../common/auth/jwt/jwt.guard");
const role_guard_1 = require("../../common/auth/role/role.guard");
const role_decorator_1 = require("../../common/auth/role/role.decorator");
const client_1 = require("@prisma/client");
const subsidiary_scope_1 = require("../../common/utils/subsidiary-scope");
let IncomestatementController = class IncomestatementController {
    incomestatementService;
    constructor(incomestatementService) {
        this.incomestatementService = incomestatementService;
    }
    resolveSubsidiaryId(req, requestedSubsidiaryId) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user, [client_1.UserRole.FINANCIAL_DIRECTOR]);
        return (0, subsidiary_scope_1.resolveEffectiveSubsidiaryId)(ctx, requestedSubsidiaryId);
    }
    async getIncomeStatement(req, subsidiaryId, startDate, endDate) {
        return this.incomestatementService.getIncomeStatement(this.resolveSubsidiaryId(req, subsidiaryId), startDate, endDate);
    }
    async getRevenue(req, subsidiaryId, startDate, endDate) {
        return this.incomestatementService.getRevenueData(this.resolveSubsidiaryId(req, subsidiaryId), startDate, endDate);
    }
    async getCogs(req, subsidiaryId, startDate, endDate) {
        return this.incomestatementService.getCogsData(this.resolveSubsidiaryId(req, subsidiaryId), startDate, endDate);
    }
    async getOperatingExpenses(req, subsidiaryId, startDate, endDate) {
        return this.incomestatementService.getOperatingExpensesData(this.resolveSubsidiaryId(req, subsidiaryId), startDate, endDate);
    }
    async getTaxes(req, subsidiaryId, startDate, endDate) {
        return this.incomestatementService.getTaxesData(this.resolveSubsidiaryId(req, subsidiaryId), startDate, endDate);
    }
};
exports.IncomestatementController = IncomestatementController;
__decorate([
    (0, common_1.Get)('pnl-statement'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('subsidiaryId')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], IncomestatementController.prototype, "getIncomeStatement", null);
__decorate([
    (0, common_1.Get)('revenue'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('subsidiaryId')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], IncomestatementController.prototype, "getRevenue", null);
__decorate([
    (0, common_1.Get)('cogs'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('subsidiaryId')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], IncomestatementController.prototype, "getCogs", null);
__decorate([
    (0, common_1.Get)('operating-expenses'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('subsidiaryId')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], IncomestatementController.prototype, "getOperatingExpenses", null);
__decorate([
    (0, common_1.Get)('taxes'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('subsidiaryId')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], IncomestatementController.prototype, "getTaxes", null);
exports.IncomestatementController = IncomestatementController = __decorate([
    (0, common_1.Controller)('finances-stats'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.FINANCIAL_DIRECTOR, client_1.UserRole.SUPER_ADMIN),
    __metadata("design:paramtypes", [incomestatement_service_1.IncomestatementService])
], IncomestatementController);
//# sourceMappingURL=incomestatement.controller.js.map