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
exports.PrefinancementController = void 0;
const common_1 = require("@nestjs/common");
const prefinancement_service_1 = require("./prefinancement.service");
const jwt_guard_1 = require("../../common/auth/jwt/jwt.guard");
const role_decorator_1 = require("../../common/auth/role/role.decorator");
const find_prefinancement_transactions_dto_1 = require("./dto/find-prefinancement-transactions.dto");
let PrefinancementController = class PrefinancementController {
    prefenancementService;
    constructor(prefenancementService) {
        this.prefenancementService = prefenancementService;
    }
    createAccount(createDto, user) {
        return this.prefenancementService.createAccount(createDto);
    }
    findAccount(user, subsidiaryId) {
        return this.prefenancementService.findAccount(subsidiaryId);
    }
    async updateAccount(updateDto, user) {
        const account = await this.prefenancementService.findAccount(updateDto.subsidiaryId || user.subsidiaryId);
        if (account) {
            return this.prefenancementService.updateAccount(account.id, updateDto);
        }
        throw new Error('No account found');
    }
    createTransaction(createDto, user) {
        return this.prefenancementService.createTransaction({
            ...createDto,
            createdBy: user.id,
        });
    }
    findTransactions(user, query) {
        return this.prefenancementService.findTransactions({
            ...query,
            subsidiaryId: query.subsidiaryId || user.subsidiaryId,
        });
    }
    findTransactionById(id, user) {
        return this.prefenancementService.findTransactionById(id);
    }
    updateTransaction(id, updateDto, user) {
        return this.prefenancementService.updateTransaction(id, updateDto);
    }
    validateTransaction(id, user) {
        return this.prefenancementService.validateTransaction(id);
    }
    cancelTransaction(id, user) {
        return this.prefenancementService.cancelTransaction(id);
    }
    deleteTransaction(id, user) {
        return this.prefenancementService.deleteTransaction(id);
    }
    getStatistics(user, subsidiaryId) {
        return this.prefenancementService.getStatistics(subsidiaryId || user.subsidiaryId);
    }
};
exports.PrefinancementController = PrefinancementController;
__decorate([
    (0, common_1.Post)('account'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PrefinancementController.prototype, "createAccount", null);
__decorate([
    (0, common_1.Get)('account'),
    __param(0, (0, role_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('subsidiaryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PrefinancementController.prototype, "findAccount", null);
__decorate([
    (0, common_1.Patch)('account'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PrefinancementController.prototype, "updateAccount", null);
__decorate([
    (0, common_1.Post)('transactions'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PrefinancementController.prototype, "createTransaction", null);
__decorate([
    (0, common_1.Get)('transactions'),
    __param(0, (0, role_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, find_prefinancement_transactions_dto_1.FindPrefinancementTransactionsDto]),
    __metadata("design:returntype", void 0)
], PrefinancementController.prototype, "findTransactions", null);
__decorate([
    (0, common_1.Get)('transactions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PrefinancementController.prototype, "findTransactionById", null);
__decorate([
    (0, common_1.Patch)('transactions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], PrefinancementController.prototype, "updateTransaction", null);
__decorate([
    (0, common_1.Patch)('transactions/:id/validate'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PrefinancementController.prototype, "validateTransaction", null);
__decorate([
    (0, common_1.Patch)('transactions/:id/cancel'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PrefinancementController.prototype, "cancelTransaction", null);
__decorate([
    (0, common_1.Delete)('transactions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PrefinancementController.prototype, "deleteTransaction", null);
__decorate([
    (0, common_1.Get)('statistics'),
    __param(0, (0, role_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('subsidiaryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PrefinancementController.prototype, "getStatistics", null);
exports.PrefinancementController = PrefinancementController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('finance/prefinancement'),
    __metadata("design:paramtypes", [prefinancement_service_1.PrefinancementService])
], PrefinancementController);
//# sourceMappingURL=prefinancement.controller.js.map