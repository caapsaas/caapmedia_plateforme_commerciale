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
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const analytics_service_1 = require("./analytics.service");
const period_filter_dto_1 = require("./dto/period-filter.dto");
const jwt_guard_1 = require("../../common/auth/jwt/jwt.guard");
const role_guard_1 = require("../../common/auth/role/role.guard");
const role_decorator_1 = require("../../common/auth/role/role.decorator");
const client_1 = require("@prisma/client");
let AnalyticsController = class AnalyticsController {
    analyticsService;
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    getDashboardStats(req, periodFilterDto, subsidiaryId) {
        return this.analyticsService.getDashboardStats(req.user, periodFilterDto, subsidiaryId);
    }
    getSalesAnalysis(req, periodFilterDto, subsidiaryId) {
        return this.analyticsService.getSalesAnalysis(req.user, periodFilterDto, subsidiaryId);
    }
    getPurchaseAnalysis(req, periodFilterDto, subsidiaryId) {
        return this.analyticsService.getPurchaseAnalysis(req.user, periodFilterDto, subsidiaryId);
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.FINANCIAL_DIRECTOR, client_1.UserRole.SUPER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Query)('subsidiaryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, period_filter_dto_1.PeriodFilterDto, String]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)('sales'),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.FINANCIAL_DIRECTOR, client_1.UserRole.COMMERCIAL, client_1.UserRole.SUPER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Query)('subsidiaryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, period_filter_dto_1.PeriodFilterDto, String]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getSalesAnalysis", null);
__decorate([
    (0, common_1.Get)('purchases'),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.FINANCIAL_DIRECTOR, client_1.UserRole.COMMERCIAL, client_1.UserRole.SUPER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Query)('subsidiaryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, period_filter_dto_1.PeriodFilterDto, String]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getPurchaseAnalysis", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, common_1.Controller)('analytics'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map