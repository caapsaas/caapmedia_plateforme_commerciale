"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JournalizationModule = void 0;
const common_1 = require("@nestjs/common");
const journalization_service_1 = require("./journalization.service");
const accounts_module_1 = require("../accounts/accounts.module");
const journals_module_1 = require("../journals/journals.module");
const periods_module_1 = require("../periods/periods.module");
const entries_module_1 = require("../entries/entries.module");
let JournalizationModule = class JournalizationModule {
};
exports.JournalizationModule = JournalizationModule;
exports.JournalizationModule = JournalizationModule = __decorate([
    (0, common_1.Module)({
        imports: [accounts_module_1.AccountsModule, journals_module_1.JournalsModule, periods_module_1.PeriodsModule, entries_module_1.EntriesModule],
        providers: [journalization_service_1.JournalizationService],
        exports: [journalization_service_1.JournalizationService],
    })
], JournalizationModule);
//# sourceMappingURL=journalization.module.js.map