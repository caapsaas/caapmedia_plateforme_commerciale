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
exports.PayrollRecordController = void 0;
const common_1 = require("@nestjs/common");
const payrollrecord_service_1 = require("./payrollrecord.service");
const payroll_bonus_and_charge_service_1 = require("./payroll-bonus-and-charge.service");
const payroll_cumulative_service_1 = require("./payroll-cumulative.service");
const cameroonpayrollcalculator_service_1 = require("./cameroonpayrollcalculator.service");
const payrollrecord_dto_1 = require("./dto/payrollrecord.dto");
const payroll_bonus_and_charge_dto_1 = require("./dto/payroll-bonus-and-charge.dto");
const jwt_guard_1 = require("../../common/auth/jwt/jwt.guard");
const role_guard_1 = require("../../common/auth/role/role.guard");
const role_decorator_1 = require("../../common/auth/role/role.decorator");
const subsidiary_scope_1 = require("../../common/utils/subsidiary-scope");
const pagination_query_dto_1 = require("../../common/pagination/dto/pagination-query.dto");
let PayrollRecordController = class PayrollRecordController {
    payrollRecordService;
    bonusAndChargeService;
    cumulativeService;
    calculator;
    constructor(payrollRecordService, bonusAndChargeService, cumulativeService, calculator) {
        this.payrollRecordService = payrollRecordService;
        this.bonusAndChargeService = bonusAndChargeService;
        this.cumulativeService = cumulativeService;
        this.calculator = calculator;
    }
    create(dto, req) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        const subsidiaryId = (0, subsidiary_scope_1.resolveEffectiveSubsidiaryId)(ctx);
        return this.payrollRecordService.create(dto, dto.employeeId, subsidiaryId);
    }
    findAll(req, query) {
        const paginationQuery = new pagination_query_dto_1.PaginationQueryDto();
        paginationQuery.page = query.page ? Number(query.page) : 1;
        paginationQuery.limit = query.limit ? Number(query.limit) : 10;
        paginationQuery.search = query.search;
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        const targetSubsidiaryId = (0, subsidiary_scope_1.resolveEffectiveSubsidiaryId)(ctx, query.subsidiaryId);
        return this.payrollRecordService.findAll(targetSubsidiaryId, paginationQuery);
    }
    findAllGlobal(req) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        if (!ctx.hasGlobalScope) {
            throw new common_1.ForbiddenException('Accès réservé au SUPER_ADMIN');
        }
        return this.payrollRecordService.findAllGlobal();
    }
    findByPeriod(period, req, subsidiaryIdFilter) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        const targetSubsidiaryId = (0, subsidiary_scope_1.resolveEffectiveSubsidiaryId)(ctx, subsidiaryIdFilter);
        return this.payrollRecordService.findByPeriod(targetSubsidiaryId, period);
    }
    async findByEmployee(employeeId, req) {
        const employee = await this.payrollRecordService.findEmployeeForScope(employeeId);
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(employee.subsidiaryId, (0, subsidiary_scope_1.resolveScopeContext)(req.user));
        return this.payrollRecordService.findByEmployee(employeeId, employee.subsidiaryId);
    }
    async findOne(id, req) {
        const record = await this.payrollRecordService.findOne(id);
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(record.subsidiaryId, (0, subsidiary_scope_1.resolveScopeContext)(req.user));
        return record;
    }
    processPayroll(body, req) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        const targetSubsidiaryId = (0, subsidiary_scope_1.resolveEffectiveSubsidiaryId)(ctx, body.subsidiaryId);
        return this.payrollRecordService.processPayroll(targetSubsidiaryId, body.period, {
            riskGroup: body.riskGroup,
            applyCfc: body.applyCfc,
            applyFne: body.applyFne,
            forceRegenerate: body.forceRegenerate,
        });
    }
    simulatePayroll(body) {
        return this.payrollRecordService.simulatePayroll(body.employeeId, {
            bonus: body.bonus,
            allowances: body.allowances,
            overtime: body.overtime,
            riskGroup: body.riskGroup,
        });
    }
    simulateNetToGross(body) {
        const result = this.calculator.calculateFromNetSalary({
            targetNetSalary: body.targetNetSalary,
            bonus: body.bonus ?? 0,
            riskGroup: body.riskGroup ?? 'A',
            applyCfc: true,
            applyFne: true,
        });
        return result;
    }
    async update(id, dto, req) {
        const record = await this.payrollRecordService.findOne(id);
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(record.subsidiaryId, ctx);
        return this.payrollRecordService.update(id, dto);
    }
    async signPayrollRecord(id, body, req) {
        const record = await this.payrollRecordService.findOne(id);
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(record.subsidiaryId, ctx);
        return this.payrollRecordService.signPayrollRecord(id, body.signature);
    }
    async generateThirteenthMonth(dto, req) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        const subsidiaryId = (0, subsidiary_scope_1.resolveEffectiveSubsidiaryId)(ctx);
        return this.bonusAndChargeService.generateThirteenthMonth(dto.employeeId, dto.month, dto.year);
    }
    async getPendingBonuses(req) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        const subsidiaryId = (0, subsidiary_scope_1.resolveEffectiveSubsidiaryId)(ctx);
        return this.bonusAndChargeService.getPendingBonuses(subsidiaryId);
    }
    async getApprovedBonuses(req) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        const subsidiaryId = (0, subsidiary_scope_1.resolveEffectiveSubsidiaryId)(ctx);
        return this.bonusAndChargeService.getApprovedBonuses(subsidiaryId);
    }
    async approveBonus(bonusId, req) {
        await this.assertBonusScope(bonusId, req.user);
        return this.bonusAndChargeService.approveBonus(bonusId, req.user.id);
    }
    async recordBonusPayment(bonusId, dto, req) {
        await this.assertBonusScope(bonusId, req.user);
        return this.bonusAndChargeService.recordBonusPayment(bonusId, dto.bankTransferId, dto.paymentDate ? new Date(dto.paymentDate) : new Date());
    }
    async cancelBonus(bonusId, dto, req) {
        await this.assertBonusScope(bonusId, req.user);
        return this.bonusAndChargeService.cancelBonus(bonusId, dto.reason);
    }
    async extractBonusesFromPayroll(dto, req) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        const subsidiaryId = (0, subsidiary_scope_1.resolveEffectiveSubsidiaryId)(ctx);
        return this.bonusAndChargeService.extractBonusesFromPayroll(subsidiaryId, dto.month);
    }
    async accumulateCharges(dto, req) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        const subsidiaryId = (0, subsidiary_scope_1.resolveEffectiveSubsidiaryId)(ctx, dto.subsidiaryId);
        return this.bonusAndChargeService.accumulateEmployerCharges(subsidiaryId, dto.month);
    }
    async createSalaryCharge(dto, req) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        const subsidiaryId = (0, subsidiary_scope_1.resolveEffectiveSubsidiaryId)(ctx, dto.subsidiaryId);
        return this.bonusAndChargeService.createSalaryCharge(subsidiaryId, dto.month, dto.paymentMethod);
    }
    async getOverdueCharges(req) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        const subsidiaryId = (0, subsidiary_scope_1.resolveEffectiveSubsidiaryId)(ctx);
        return this.bonusAndChargeService.getOverdueCharges(subsidiaryId);
    }
    async getChargesDueThisMonth(req) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        const subsidiaryId = (0, subsidiary_scope_1.resolveEffectiveSubsidiaryId)(ctx);
        return this.bonusAndChargeService.getChargesDueThisMonth(subsidiaryId);
    }
    async getChargesSummary(startMonth, endMonth, req) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        const subsidiaryId = (0, subsidiary_scope_1.resolveEffectiveSubsidiaryId)(ctx);
        return this.bonusAndChargeService.getChargesSummary(subsidiaryId, startMonth, endMonth);
    }
    async recordChargePayment(chargePaymentId, dto, req) {
        const subsidiaryId = await this.bonusAndChargeService.getChargeSubsidiaryId(chargePaymentId);
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(subsidiaryId, (0, subsidiary_scope_1.resolveScopeContext)(req.user));
        return this.bonusAndChargeService.recordChargePayment(chargePaymentId, dto.bankTransferId, dto.paidAmount, dto.declarationNumber);
    }
    async assertBonusScope(bonusId, user) {
        const subsidiaryId = await this.bonusAndChargeService.getBonusSubsidiaryId(bonusId);
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(subsidiaryId, (0, subsidiary_scope_1.resolveScopeContext)(user));
    }
    async getAnnualCumulative(employeeId, year) {
        const queryYear = year || new Date().getFullYear().toString();
        return this.cumulativeService.getAnnualCumulative(employeeId, queryYear);
    }
    async getDeductionDetails(payrollRecordId, req) {
        const payroll = await this.payrollRecordService.findOne(payrollRecordId);
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(payroll.subsidiaryId, ctx);
        return this.cumulativeService.getDeductionDetails(payrollRecordId);
    }
    async remove(id, req) {
        const record = await this.payrollRecordService.findOne(id);
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(req.user);
        (0, subsidiary_scope_1.assertSubsidiaryAccess)(record.subsidiaryId, ctx);
        return this.payrollRecordService.remove(id);
    }
};
exports.PayrollRecordController = PayrollRecordController;
__decorate([
    (0, common_1.Post)(),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [payrollrecord_dto_1.CreatePayrollRecordDto, Object]),
    __metadata("design:returntype", void 0)
], PayrollRecordController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PayrollRecordController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('global'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)('SUPER_ADMIN'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PayrollRecordController.prototype, "findAllGlobal", null);
__decorate([
    (0, common_1.Get)('by-period'),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN'),
    __param(0, (0, common_1.Query)('period')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Query)('subsidiaryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], PayrollRecordController.prototype, "findByPeriod", null);
__decorate([
    (0, common_1.Get)('by-employee/:employeeId'),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN'),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PayrollRecordController.prototype, "findByEmployee", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PayrollRecordController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)('process'),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PayrollRecordController.prototype, "processPayroll", null);
__decorate([
    (0, common_1.Post)('simulate'),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PayrollRecordController.prototype, "simulatePayroll", null);
__decorate([
    (0, common_1.Post)('simulate-net-to-gross'),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PayrollRecordController.prototype, "simulateNetToGross", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, payrollrecord_dto_1.UpdatePayrollRecordDto, Object]),
    __metadata("design:returntype", Promise)
], PayrollRecordController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/sign'),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], PayrollRecordController.prototype, "signPayrollRecord", null);
__decorate([
    (0, common_1.Post)('bonus/thirteenth-month'),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [payroll_bonus_and_charge_dto_1.GenerateThirteenthMonthDto, Object]),
    __metadata("design:returntype", Promise)
], PayrollRecordController.prototype, "generateThirteenthMonth", null);
__decorate([
    (0, common_1.Get)('bonus/pending'),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PayrollRecordController.prototype, "getPendingBonuses", null);
__decorate([
    (0, common_1.Get)('bonus/approved'),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PayrollRecordController.prototype, "getApprovedBonuses", null);
__decorate([
    (0, common_1.Post)('bonus/:bonusId/approve'),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN'),
    __param(0, (0, common_1.Param)('bonusId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PayrollRecordController.prototype, "approveBonus", null);
__decorate([
    (0, common_1.Post)('bonus/:bonusId/pay'),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN'),
    __param(0, (0, common_1.Param)('bonusId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, payroll_bonus_and_charge_dto_1.RecordBonusPaymentDto, Object]),
    __metadata("design:returntype", Promise)
], PayrollRecordController.prototype, "recordBonusPayment", null);
__decorate([
    (0, common_1.Post)('bonus/:bonusId/cancel'),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN'),
    __param(0, (0, common_1.Param)('bonusId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, payroll_bonus_and_charge_dto_1.CancelBonusDto, Object]),
    __metadata("design:returntype", Promise)
], PayrollRecordController.prototype, "cancelBonus", null);
__decorate([
    (0, common_1.Post)('bonus/extract-from-payroll'),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PayrollRecordController.prototype, "extractBonusesFromPayroll", null);
__decorate([
    (0, common_1.Post)('charges/accumulate'),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN', 'FINANCIAL_DIRECTOR'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [payroll_bonus_and_charge_dto_1.AccumulateChargesDto, Object]),
    __metadata("design:returntype", Promise)
], PayrollRecordController.prototype, "accumulateCharges", null);
__decorate([
    (0, common_1.Post)('charges/salary'),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN', 'FINANCIAL_DIRECTOR'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [payroll_bonus_and_charge_dto_1.CreateSalaryChargeDto, Object]),
    __metadata("design:returntype", Promise)
], PayrollRecordController.prototype, "createSalaryCharge", null);
__decorate([
    (0, common_1.Get)('charges/overdue'),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PayrollRecordController.prototype, "getOverdueCharges", null);
__decorate([
    (0, common_1.Get)('charges/due-this-month'),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PayrollRecordController.prototype, "getChargesDueThisMonth", null);
__decorate([
    (0, common_1.Get)('charges/summary'),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN'),
    __param(0, (0, common_1.Query)('startMonth')),
    __param(1, (0, common_1.Query)('endMonth')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], PayrollRecordController.prototype, "getChargesSummary", null);
__decorate([
    (0, common_1.Post)('charges/:chargePaymentId/pay'),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN'),
    __param(0, (0, common_1.Param)('chargePaymentId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, payroll_bonus_and_charge_dto_1.RecordChargePaymentDto, Object]),
    __metadata("design:returntype", Promise)
], PayrollRecordController.prototype, "recordChargePayment", null);
__decorate([
    (0, common_1.Get)('cumulative/:employeeId'),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN'),
    __param(0, (0, common_1.Param)('employeeId')),
    __param(1, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PayrollRecordController.prototype, "getAnnualCumulative", null);
__decorate([
    (0, common_1.Get)(':payrollRecordId/deduction-details'),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN'),
    __param(0, (0, common_1.Param)('payrollRecordId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PayrollRecordController.prototype, "getDeductionDetails", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, role_decorator_1.Roles)('HR_MANAGER', 'ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PayrollRecordController.prototype, "remove", null);
exports.PayrollRecordController = PayrollRecordController = __decorate([
    (0, common_1.Controller)('hr/payroll-records'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    __metadata("design:paramtypes", [payrollrecord_service_1.PayrollRecordService,
        payroll_bonus_and_charge_service_1.PayrollBonusAndChargeService,
        payroll_cumulative_service_1.PayrollCumulativeService,
        cameroonpayrollcalculator_service_1.CameroonPayrollCalculatorService])
], PayrollRecordController);
//# sourceMappingURL=payrollrecord.controller.js.map