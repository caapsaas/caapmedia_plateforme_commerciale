"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BalancesheetModule = void 0;
const common_1 = require("@nestjs/common");
const balancesheet_service_1 = require("./balancesheet.service");
const balancesheet_controller_1 = require("./balancesheet.controller");
const accounting_shared_module_1 = require("../../accounting/shared/accounting-shared.module");
let BalancesheetModule = class BalancesheetModule {
};
exports.BalancesheetModule = BalancesheetModule;
exports.BalancesheetModule = BalancesheetModule = __decorate([
    (0, common_1.Module)({
        imports: [accounting_shared_module_1.AccountingSharedModule],
        providers: [balancesheet_service_1.BalancesheetService],
        controllers: [balancesheet_controller_1.BalancesheetController],
    })
], BalancesheetModule);
//# sourceMappingURL=balancesheet.module.js.map