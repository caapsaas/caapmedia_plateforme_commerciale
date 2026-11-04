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
exports.TaxTransparencyController = void 0;
const common_1 = require("@nestjs/common");
const tax_transparency_service_1 = require("./tax-transparency.service");
const tax_transparency_period_dto_1 = require("./dto/tax-transparency-period.dto");
const jwt_guard_1 = require("../../common/auth/jwt/jwt.guard");
const role_guard_1 = require("../../common/auth/role/role.guard");
const role_decorator_1 = require("../../common/auth/role/role.decorator");
const client_1 = require("@prisma/client");
let TaxTransparencyController = class TaxTransparencyController {
    taxTransparencyService;
    constructor(taxTransparencyService) {
        this.taxTransparencyService = taxTransparencyService;
    }
    getPayrollSummary(query, user) {
        return this.taxTransparencyService.getPayrollSummary(query, user);
    }
    getVatSummary(query, user) {
        return this.taxTransparencyService.getVatSummary(query, user);
    }
    getIrppDetail(query, user) {
        return this.taxTransparencyService.getIrppDetail(query, user);
    }
    getCnpsDetail(query, user) {
        return this.taxTransparencyService.getCnpsDetail(query, user);
    }
    getCfcFneDetail(query, user) {
        return this.taxTransparencyService.getCfcFneDetail(query, user);
    }
    getVatDetail(query, user) {
        return this.taxTransparencyService.getVatDetail(query, user);
    }
};
exports.TaxTransparencyController = TaxTransparencyController;
__decorate([
    (0, common_1.Get)('payroll-summary'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tax_transparency_period_dto_1.TaxTransparencyPeriodDto, Object]),
    __metadata("design:returntype", void 0)
], TaxTransparencyController.prototype, "getPayrollSummary", null);
__decorate([
    (0, common_1.Get)('vat-summary'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tax_transparency_period_dto_1.TaxTransparencyPeriodDto, Object]),
    __metadata("design:returntype", void 0)
], TaxTransparencyController.prototype, "getVatSummary", null);
__decorate([
    (0, common_1.Get)('irpp-detail'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tax_transparency_period_dto_1.TaxTransparencyPeriodDto, Object]),
    __metadata("design:returntype", void 0)
], TaxTransparencyController.prototype, "getIrppDetail", null);
__decorate([
    (0, common_1.Get)('cnps-detail'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tax_transparency_period_dto_1.TaxTransparencyPeriodDto, Object]),
    __metadata("design:returntype", void 0)
], TaxTransparencyController.prototype, "getCnpsDetail", null);
__decorate([
    (0, common_1.Get)('cfc-fne-detail'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tax_transparency_period_dto_1.TaxTransparencyPeriodDto, Object]),
    __metadata("design:returntype", void 0)
], TaxTransparencyController.prototype, "getCfcFneDetail", null);
__decorate([
    (0, common_1.Get)('vat-detail'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tax_transparency_period_dto_1.TaxTransparencyPeriodDto, Object]),
    __metadata("design:returntype", void 0)
], TaxTransparencyController.prototype, "getVatDetail", null);
exports.TaxTransparencyController = TaxTransparencyController = __decorate([
    (0, common_1.Controller)('finance/tax-transparency'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.FINANCIAL_DIRECTOR),
    __metadata("design:paramtypes", [tax_transparency_service_1.TaxTransparencyService])
], TaxTransparencyController);
//# sourceMappingURL=tax-transparency.controller.js.map