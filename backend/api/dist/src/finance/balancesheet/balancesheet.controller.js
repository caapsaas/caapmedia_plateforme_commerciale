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
exports.BalancesheetController = void 0;
const common_1 = require("@nestjs/common");
const balancesheet_service_1 = require("./balancesheet.service");
const jwt_guard_1 = require("../../common/auth/jwt/jwt.guard");
const role_guard_1 = require("../../common/auth/role/role.guard");
const role_decorator_1 = require("../../common/auth/role/role.decorator");
const client_1 = require("@prisma/client");
const subsidiary_scope_1 = require("../../common/utils/subsidiary-scope");
let BalancesheetController = class BalancesheetController {
    balancesheetService;
    constructor(balancesheetService) {
        this.balancesheetService = balancesheetService;
    }
    resolveSubsidiaryId(req, requestedSubsidiaryId) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user, [client_1.UserRole.FINANCIAL_DIRECTOR]);
        return (0, subsidiary_scope_1.resolveEffectiveSubsidiaryId)(ctx, requestedSubsidiaryId);
    }
    async getBalanceSheet(req, subsidiaryId) {
        return this.balancesheetService.getBalanceSheet(this.resolveSubsidiaryId(req, subsidiaryId));
    }
    async getTreasuryData(req, subsidiaryId) {
        return this.balancesheetService.getTreasuryData(this.resolveSubsidiaryId(req, subsidiaryId));
    }
    async getCustomerReceivables(req, subsidiaryId) {
        const totalReceivables = await this.balancesheetService.getCustomerReceivables(this.resolveSubsidiaryId(req, subsidiaryId));
        return { totalReceivables };
    }
    getInventoryValue() {
        return this.balancesheetService.getInventoryValue();
    }
    async getEquipmentsValue(req, subsidiaryId) {
        return this.balancesheetService.getEquipmentsValue(this.resolveSubsidiaryId(req, subsidiaryId));
    }
    async getFixedAssetsValue(req, subsidiaryId) {
        return this.balancesheetService.getFixedAssetsValue(this.resolveSubsidiaryId(req, subsidiaryId));
    }
    async getSupplierDebts(req, subsidiaryId) {
        const totalDebts = await this.balancesheetService.getSupplierDebts(this.resolveSubsidiaryId(req, subsidiaryId));
        return { totalDebts };
    }
    async getShareCapital(req, subsidiaryId) {
        return this.balancesheetService.getShareCapital(this.resolveSubsidiaryId(req, subsidiaryId));
    }
    async getAccumulatedNetIncome(req, subsidiaryId) {
        return this.balancesheetService.getAccumulatedNetIncome(this.resolveSubsidiaryId(req, subsidiaryId));
    }
};
exports.BalancesheetController = BalancesheetController;
__decorate([
    (0, common_1.Get)('balance-sheet'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('subsidiaryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BalancesheetController.prototype, "getBalanceSheet", null);
__decorate([
    (0, common_1.Get)('treasury'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('subsidiaryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BalancesheetController.prototype, "getTreasuryData", null);
__decorate([
    (0, common_1.Get)('customer-receivables'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('subsidiaryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BalancesheetController.prototype, "getCustomerReceivables", null);
__decorate([
    (0, common_1.Get)('inventory'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Number)
], BalancesheetController.prototype, "getInventoryValue", null);
__decorate([
    (0, common_1.Get)('equipments'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('subsidiaryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BalancesheetController.prototype, "getEquipmentsValue", null);
__decorate([
    (0, common_1.Get)('fixed-assets'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('subsidiaryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BalancesheetController.prototype, "getFixedAssetsValue", null);
__decorate([
    (0, common_1.Get)('supplier-debts'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('subsidiaryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BalancesheetController.prototype, "getSupplierDebts", null);
__decorate([
    (0, common_1.Get)('share-capital'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('subsidiaryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BalancesheetController.prototype, "getShareCapital", null);
__decorate([
    (0, common_1.Get)('net-income'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('subsidiaryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BalancesheetController.prototype, "getAccumulatedNetIncome", null);
exports.BalancesheetController = BalancesheetController = __decorate([
    (0, common_1.Controller)('finances-stats'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.FINANCIAL_DIRECTOR, client_1.UserRole.SUPER_ADMIN),
    __metadata("design:paramtypes", [balancesheet_service_1.BalancesheetService])
], BalancesheetController);
//# sourceMappingURL=balancesheet.controller.js.map