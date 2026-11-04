"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashRemittanceModule = void 0;
const common_1 = require("@nestjs/common");
const cash_remittance_controller_1 = require("./cash-remittance.controller");
const cash_remittance_service_1 = require("./cash-remittance.service");
const accounting_outbox_module_1 = require("../../accounting/outbox/accounting-outbox.module");
let CashRemittanceModule = class CashRemittanceModule {
};
exports.CashRemittanceModule = CashRemittanceModule;
exports.CashRemittanceModule = CashRemittanceModule = __decorate([
    (0, common_1.Module)({
        imports: [accounting_outbox_module_1.AccountingOutboxModule],
        controllers: [cash_remittance_controller_1.CashRemittanceController],
        providers: [cash_remittance_service_1.CashRemittanceService],
    })
], CashRemittanceModule);
//# sourceMappingURL=cash-remittance.module.js.map