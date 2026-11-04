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
exports.DebtsController = void 0;
const common_1 = require("@nestjs/common");
const debts_service_1 = require("./debts.service");
const jwt_guard_1 = require("../../common/auth/jwt/jwt.guard");
const role_decorator_1 = require("../../common/auth/role/role.decorator");
const pagination_query_dto_1 = require("../../common/pagination/dto/pagination-query.dto");
const pay_supplier_debt_dto_1 = require("./dto/pay-supplier-debt.dto");
const create_long_term_debt_dto_1 = require("./dto/create-long-term-debt.dto");
const update_long_term_debt_dto_1 = require("./dto/update-long-term-debt.dto");
let DebtsController = class DebtsController {
    debtsService;
    constructor(debtsService) {
        this.debtsService = debtsService;
    }
    findAllSupplierDebts(user, paginationQuery) {
        return this.debtsService.findAllSupplierDebts(user, paginationQuery);
    }
    paySupplierDebt(id, payDto, user) {
        return this.debtsService.paySupplierDebt(id, payDto, user);
    }
    createLongTermDebt(createDto, user) {
        return this.debtsService.createLongTermDebt(createDto, user);
    }
    findAllLongTermDebts(user, paginationQuery) {
        return this.debtsService.findAllLongTermDebts(user, paginationQuery);
    }
    updateLongTermDebt(id, updateDto, user) {
        return this.debtsService.updateLongTermDebt(id, updateDto, user);
    }
};
exports.DebtsController = DebtsController;
__decorate([
    (0, common_1.Get)('supplier'),
    __param(0, (0, role_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", void 0)
], DebtsController.prototype, "findAllSupplierDebts", null);
__decorate([
    (0, common_1.Post)('supplier/:id/pay'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pay_supplier_debt_dto_1.PaySupplierDebtDto, Object]),
    __metadata("design:returntype", void 0)
], DebtsController.prototype, "paySupplierDebt", null);
__decorate([
    (0, common_1.Post)('long-term'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_long_term_debt_dto_1.CreateLongTermDebtDto, Object]),
    __metadata("design:returntype", void 0)
], DebtsController.prototype, "createLongTermDebt", null);
__decorate([
    (0, common_1.Get)('long-term'),
    __param(0, (0, role_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", void 0)
], DebtsController.prototype, "findAllLongTermDebts", null);
__decorate([
    (0, common_1.Patch)('long-term/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_long_term_debt_dto_1.UpdateLongTermDebtDto, Object]),
    __metadata("design:returntype", void 0)
], DebtsController.prototype, "updateLongTermDebt", null);
exports.DebtsController = DebtsController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('finance/debts'),
    __metadata("design:paramtypes", [debts_service_1.DebtsService])
], DebtsController);
//# sourceMappingURL=debts.controller.js.map