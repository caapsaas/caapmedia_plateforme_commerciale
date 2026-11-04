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
exports.RecurringExpenseController = void 0;
const common_1 = require("@nestjs/common");
const recurring_expense_service_1 = require("./recurring-expense.service");
const role_decorator_1 = require("../../common/auth/role/role.decorator");
const create_recurring_expense_dto_1 = require("./dto/create-recurring-expense.dto");
const update_recurring_expense_dto_1 = require("./dto/update-recurring-expense.dto");
const jwt_guard_1 = require("../../common/auth/jwt/jwt.guard");
const pagination_query_dto_1 = require("../../common/pagination/dto/pagination-query.dto");
let RecurringExpenseController = class RecurringExpenseController {
    recurringExpenseService;
    constructor(recurringExpenseService) {
        this.recurringExpenseService = recurringExpenseService;
    }
    create(createDto, user) {
        return this.recurringExpenseService.create(createDto, user);
    }
    findAll(user, paginationQuery) {
        return this.recurringExpenseService.findAll(user, paginationQuery);
    }
    findOne(id, user) {
        return this.recurringExpenseService.findOne(id, user);
    }
    update(id, updateDto, user) {
        return this.recurringExpenseService.update(id, updateDto, user);
    }
    remove(id, user) {
        return this.recurringExpenseService.remove(id, user);
    }
};
exports.RecurringExpenseController = RecurringExpenseController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_recurring_expense_dto_1.CreateRecurringExpenseDto, Object]),
    __metadata("design:returntype", void 0)
], RecurringExpenseController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, role_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", void 0)
], RecurringExpenseController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RecurringExpenseController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_recurring_expense_dto_1.UpdateRecurringExpenseDto, Object]),
    __metadata("design:returntype", void 0)
], RecurringExpenseController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RecurringExpenseController.prototype, "remove", null);
exports.RecurringExpenseController = RecurringExpenseController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('finance/recurring-expenses'),
    __metadata("design:paramtypes", [recurring_expense_service_1.RecurringExpenseService])
], RecurringExpenseController);
//# sourceMappingURL=recurring-expense.controller.js.map