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
exports.CashRemittanceController = void 0;
const common_1 = require("@nestjs/common");
const cash_remittance_service_1 = require("./cash-remittance.service");
const create_cash_remittance_dto_1 = require("./dto/create-cash-remittance.dto");
const receive_cash_remittance_dto_1 = require("./dto/receive-cash-remittance.dto");
const role_decorator_1 = require("../../common/auth/role/role.decorator");
const jwt_guard_1 = require("../../common/auth/jwt/jwt.guard");
let CashRemittanceController = class CashRemittanceController {
    cashRemittanceService;
    constructor(cashRemittanceService) {
        this.cashRemittanceService = cashRemittanceService;
    }
    create(dto, user) {
        return this.cashRemittanceService.create(dto, user);
    }
    findAll(user) {
        return this.cashRemittanceService.findAll(user);
    }
    receive(id, dto, user) {
        return this.cashRemittanceService.receive(id, dto, user);
    }
};
exports.CashRemittanceController = CashRemittanceController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_cash_remittance_dto_1.CreateCashRemittanceDto, Object]),
    __metadata("design:returntype", void 0)
], CashRemittanceController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CashRemittanceController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)(':id/receive'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, receive_cash_remittance_dto_1.ReceiveCashRemittanceDto, Object]),
    __metadata("design:returntype", void 0)
], CashRemittanceController.prototype, "receive", null);
exports.CashRemittanceController = CashRemittanceController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('finance/cash-remittances'),
    __metadata("design:paramtypes", [cash_remittance_service_1.CashRemittanceService])
], CashRemittanceController);
//# sourceMappingURL=cash-remittance.controller.js.map