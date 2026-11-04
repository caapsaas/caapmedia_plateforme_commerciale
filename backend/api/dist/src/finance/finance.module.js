"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceModule = void 0;
const common_1 = require("@nestjs/common");
const expense_module_1 = require("./expense/expense.module");
const recurring_expense_module_1 = require("./recurring-expense/recurring-expense.module");
const tax_transparency_module_1 = require("./tax-transparency/tax-transparency.module");
const treasury_module_1 = require("./treasury/treasury.module");
const bank_module_1 = require("./bank/bank.module");
const cash_remittance_module_1 = require("./cash-remittance/cash-remittance.module");
const debts_module_1 = require("./debts/debts.module");
const assets_module_1 = require("./assets/assets.module");
const external_transaction_module_1 = require("./external-transaction/external-transaction.module");
const balancesheet_module_1 = require("./balancesheet/balancesheet.module");
const incomestatement_module_1 = require("./incomestatement/incomestatement.module");
const prefinancement_module_1 = require("./prefinancement/prefinancement.module");
const journalization_module_1 = require("../accounting/journalization/journalization.module");
let FinanceModule = class FinanceModule {
};
exports.FinanceModule = FinanceModule;
exports.FinanceModule = FinanceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            expense_module_1.ExpenseModule,
            recurring_expense_module_1.RecurringExpenseModule,
            tax_transparency_module_1.TaxTransparencyModule,
            treasury_module_1.TreasuryModule,
            bank_module_1.BankModule,
            cash_remittance_module_1.CashRemittanceModule,
            debts_module_1.DebtsModule,
            assets_module_1.AssetsModule,
            external_transaction_module_1.ExternalTransactionModule,
            balancesheet_module_1.BalancesheetModule,
            incomestatement_module_1.IncomestatementModule,
            prefinancement_module_1.PrefinancementModule,
            journalization_module_1.JournalizationModule,
        ],
    })
], FinanceModule);
//# sourceMappingURL=finance.module.js.map