"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecurringExpenseModule = void 0;
const common_1 = require("@nestjs/common");
const recurring_expense_controller_1 = require("./recurring-expense.controller");
const recurring_expense_service_1 = require("./recurring-expense.service");
const accounting_outbox_module_1 = require("../../accounting/outbox/accounting-outbox.module");
let RecurringExpenseModule = class RecurringExpenseModule {
};
exports.RecurringExpenseModule = RecurringExpenseModule;
exports.RecurringExpenseModule = RecurringExpenseModule = __decorate([
    (0, common_1.Module)({
        imports: [accounting_outbox_module_1.AccountingOutboxModule],
        controllers: [recurring_expense_controller_1.RecurringExpenseController],
        providers: [recurring_expense_service_1.RecurringExpenseService],
    })
], RecurringExpenseModule);
//# sourceMappingURL=recurring-expense.module.js.map