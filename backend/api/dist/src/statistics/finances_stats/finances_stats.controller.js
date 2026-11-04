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
exports.FinancesStatsController = void 0;
const common_1 = require("@nestjs/common");
const finances_stats_service_1 = require("./finances_stats.service");
const period_filter_dto_1 = require("../analytics/dto/period-filter.dto");
const jwt_guard_1 = require("../../common/auth/jwt/jwt.guard");
const role_guard_1 = require("../../common/auth/role/role.guard");
const role_decorator_1 = require("../../common/auth/role/role.decorator");
const client_1 = require("@prisma/client");
let FinancesStatsController = class FinancesStatsController {
    financesStatsService;
    constructor(financesStatsService) {
        this.financesStatsService = financesStatsService;
    }
    getPnlStatement(req, periodFilterDto) {
        return this.financesStatsService.getPnlStatement(req.user, periodFilterDto);
    }
    getCrmAnalysis(req, periodFilterDto) {
        return this.financesStatsService.getCrmAnalysis(req.user, periodFilterDto);
    }
};
exports.FinancesStatsController = FinancesStatsController;
__decorate([
    (0, common_1.Get)('pnl-statement'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, period_filter_dto_1.PeriodFilterDto]),
    __metadata("design:returntype", void 0)
], FinancesStatsController.prototype, "getPnlStatement", null);
__decorate([
    (0, common_1.Get)('crm-analysis'),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.FINANCIAL_DIRECTOR, client_1.UserRole.COMMERCIAL),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, period_filter_dto_1.PeriodFilterDto]),
    __metadata("design:returntype", void 0)
], FinancesStatsController.prototype, "getCrmAnalysis", null);
exports.FinancesStatsController = FinancesStatsController = __decorate([
    (0, common_1.Controller)('finances-stats'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.FINANCIAL_DIRECTOR),
    __metadata("design:paramtypes", [finances_stats_service_1.FinancesStatsService])
], FinancesStatsController);
//# sourceMappingURL=finances_stats.controller.js.map