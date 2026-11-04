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
exports.TreasuryController = void 0;
const common_1 = require("@nestjs/common");
const treasury_service_1 = require("./treasury.service");
const jwt_guard_1 = require("../../common/auth/jwt/jwt.guard");
const role_guard_1 = require("../../common/auth/role/role.guard");
const role_decorator_1 = require("../../common/auth/role/role.decorator");
const create_treasury_account_dto_1 = require("./dto/create-treasury-account.dto");
const update_treasury_account_dto_1 = require("./dto/update-treasury-account.dto");
const create_financial_transaction_dto_1 = require("./dto/create-financial-transaction.dto");
const update_transaction_status_dto_1 = require("./dto/update-transaction-status.dto");
const create_disbursement_dto_1 = require("./dto/create-disbursement.dto");
const client_1 = require("@prisma/client");
const pagination_query_dto_1 = require("../../common/pagination/dto/pagination-query.dto");
let TreasuryController = class TreasuryController {
    treasuryService;
    constructor(treasuryService) {
        this.treasuryService = treasuryService;
    }
    createAccount(createDto, user) {
        return this.treasuryService.createAccount(createDto, user);
    }
    findAllAccounts(user, subsidiaryId) {
        return this.treasuryService.findAllAccounts(user, subsidiaryId);
    }
    findOneAccount(id, user) {
        return this.treasuryService.findOneAccount(id, user);
    }
    updateAccount(id, updateDto, user) {
        return this.treasuryService.updateAccount(id, updateDto, user);
    }
    deleteAccount(id, user) {
        return this.treasuryService.deleteAccount(id, user);
    }
    createIncomeTransaction(createDto, user) {
        return this.treasuryService.createIncomeTransaction(createDto, user);
    }
    createExpenseTransaction(createDto, user) {
        return this.treasuryService.createExpenseTransaction(createDto, user);
    }
    createDisbursement(createDto, user) {
        return this.treasuryService.createDisbursement(createDto, user);
    }
    findAllCounterparties(user, type) {
        return this.treasuryService.findAllCounterparties(user, type);
    }
    findEligibleCashiers(user, subsidiaryId) {
        return this.treasuryService.findEligibleCashiers(user, subsidiaryId);
    }
    findAccountTransactions(id, user, paginationQuery, startDate, endDate) {
        return this.treasuryService.findAccountTransactions(id, user, paginationQuery, startDate, endDate);
    }
    findAllTransactions(user, paginationQuery, subsidiaryId) {
        return this.treasuryService.findAllTransactions(user, subsidiaryId, paginationQuery);
    }
    deleteTransaction(id, user) {
        return this.treasuryService.deleteTransaction(id, user);
    }
    updateTransactionStatus(id, updateDto, user) {
        return this.treasuryService.updateTransactionStatus(id, updateDto, user);
    }
};
exports.TreasuryController = TreasuryController;
__decorate([
    (0, common_1.Post)('accounts'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_treasury_account_dto_1.CreateTreasuryAccountDto, Object]),
    __metadata("design:returntype", void 0)
], TreasuryController.prototype, "createAccount", null);
__decorate([
    (0, common_1.Get)('accounts'),
    __param(0, (0, role_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('subsidiaryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TreasuryController.prototype, "findAllAccounts", null);
__decorate([
    (0, common_1.Get)('accounts/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TreasuryController.prototype, "findOneAccount", null);
__decorate([
    (0, common_1.Patch)('accounts/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_treasury_account_dto_1.UpdateTreasuryAccountDto, Object]),
    __metadata("design:returntype", void 0)
], TreasuryController.prototype, "updateAccount", null);
__decorate([
    (0, common_1.Delete)('accounts/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TreasuryController.prototype, "deleteAccount", null);
__decorate([
    (0, common_1.Post)('incomes'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_financial_transaction_dto_1.CreateFinancialTransactionDto, Object]),
    __metadata("design:returntype", void 0)
], TreasuryController.prototype, "createIncomeTransaction", null);
__decorate([
    (0, common_1.Post)('expenses'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_financial_transaction_dto_1.CreateFinancialTransactionDto, Object]),
    __metadata("design:returntype", void 0)
], TreasuryController.prototype, "createExpenseTransaction", null);
__decorate([
    (0, common_1.Post)('disbursement'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_disbursement_dto_1.CreateDisbursementDto, Object]),
    __metadata("design:returntype", void 0)
], TreasuryController.prototype, "createDisbursement", null);
__decorate([
    (0, common_1.Get)('counterparties'),
    __param(0, (0, role_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TreasuryController.prototype, "findAllCounterparties", null);
__decorate([
    (0, common_1.Get)('cashiers'),
    __param(0, (0, role_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('subsidiaryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TreasuryController.prototype, "findEligibleCashiers", null);
__decorate([
    (0, common_1.Get)('accounts/:id/transactions'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Query)()),
    __param(3, (0, common_1.Query)('startDate')),
    __param(4, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, pagination_query_dto_1.PaginationQueryDto, String, String]),
    __metadata("design:returntype", void 0)
], TreasuryController.prototype, "findAccountTransactions", null);
__decorate([
    (0, common_1.Get)('transactions'),
    __param(0, (0, role_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Query)('subsidiaryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pagination_query_dto_1.PaginationQueryDto, String]),
    __metadata("design:returntype", void 0)
], TreasuryController.prototype, "findAllTransactions", null);
__decorate([
    (0, common_1.Delete)('transactions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TreasuryController.prototype, "deleteTransaction", null);
__decorate([
    (0, common_1.Patch)('transaction/:id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_transaction_status_dto_1.UpdateTransactionStatusDto, Object]),
    __metadata("design:returntype", void 0)
], TreasuryController.prototype, "updateTransactionStatus", null);
exports.TreasuryController = TreasuryController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN, client_1.UserRole.FINANCIAL_DIRECTOR),
    (0, common_1.Controller)('finance/treasury'),
    __metadata("design:paramtypes", [treasury_service_1.TreasuryService])
], TreasuryController);
//# sourceMappingURL=treasury.controller.js.map