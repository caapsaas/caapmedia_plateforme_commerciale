"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountingModule = void 0;
const common_1 = require("@nestjs/common");
const accounts_module_1 = require("./accounts/accounts.module");
const entries_module_1 = require("./entries/entries.module");
const periods_module_1 = require("./periods/periods.module");
const reports_module_1 = require("./reports/reports.module");
const journals_module_1 = require("./journals/journals.module");
const journalization_module_1 = require("./journalization/journalization.module");
const accounting_outbox_module_1 = require("./outbox/accounting-outbox.module");
const accounting_shared_module_1 = require("./shared/accounting-shared.module");
const immobilisations_module_1 = require("./immobilisations/immobilisations.module");
let AccountingModule = class AccountingModule {
};
exports.AccountingModule = AccountingModule;
exports.AccountingModule = AccountingModule = __decorate([
    (0, common_1.Module)({
        imports: [
            accounts_module_1.AccountsModule,
            entries_module_1.EntriesModule,
            periods_module_1.PeriodsModule,
            reports_module_1.ReportsModule,
            journals_module_1.JournalsModule,
            journalization_module_1.JournalizationModule,
            accounting_outbox_module_1.AccountingOutboxModule,
            accounting_shared_module_1.AccountingSharedModule,
            immobilisations_module_1.ImmobilisationsModule,
        ],
        exports: [
            journalization_module_1.JournalizationModule,
            accounting_outbox_module_1.AccountingOutboxModule,
            accounting_shared_module_1.AccountingSharedModule,
        ],
    })
], AccountingModule);
//# sourceMappingURL=accounting.module.js.map