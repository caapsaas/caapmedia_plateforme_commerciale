"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImmobilisationsModule = void 0;
const common_1 = require("@nestjs/common");
const immobilisations_service_1 = require("./immobilisations.service");
const immobilisations_controller_1 = require("./immobilisations.controller");
const entries_module_1 = require("../entries/entries.module");
const accounts_module_1 = require("../accounts/accounts.module");
const accounting_access_module_1 = require("../../accounting-access/accounting-access.module");
let ImmobilisationsModule = class ImmobilisationsModule {
};
exports.ImmobilisationsModule = ImmobilisationsModule;
exports.ImmobilisationsModule = ImmobilisationsModule = __decorate([
    (0, common_1.Module)({
        imports: [entries_module_1.EntriesModule, accounts_module_1.AccountsModule, accounting_access_module_1.AccountingAccessModule],
        controllers: [immobilisations_controller_1.ImmobilisationsController],
        providers: [immobilisations_service_1.ImmobilisationsService],
        exports: [immobilisations_service_1.ImmobilisationsService],
    })
], ImmobilisationsModule);
//# sourceMappingURL=immobilisations.module.js.map