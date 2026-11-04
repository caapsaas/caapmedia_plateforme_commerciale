"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollrecordModule = void 0;
const common_1 = require("@nestjs/common");
const payrollrecord_service_1 = require("./payrollrecord.service");
const cameroonpayrollcalculator_service_1 = require("./cameroonpayrollcalculator.service");
const payroll_bonus_and_charge_service_1 = require("./payroll-bonus-and-charge.service");
const payroll_cumulative_service_1 = require("./payroll-cumulative.service");
const payrollrecord_controller_1 = require("./payrollrecord.controller");
const utils_module_1 = require("../../common/utils/utils.module");
const accounting_module_1 = require("../../accounting/accounting.module");
let PayrollrecordModule = class PayrollrecordModule {
};
exports.PayrollrecordModule = PayrollrecordModule;
exports.PayrollrecordModule = PayrollrecordModule = __decorate([
    (0, common_1.Module)({
        imports: [utils_module_1.UtilsModule, accounting_module_1.AccountingModule],
        controllers: [payrollrecord_controller_1.PayrollRecordController],
        providers: [
            payrollrecord_service_1.PayrollRecordService,
            cameroonpayrollcalculator_service_1.CameroonPayrollCalculatorService,
            payroll_bonus_and_charge_service_1.PayrollBonusAndChargeService,
            payroll_cumulative_service_1.PayrollCumulativeService,
        ],
        exports: [
            payroll_bonus_and_charge_service_1.PayrollBonusAndChargeService,
            payrollrecord_service_1.PayrollRecordService,
            payroll_cumulative_service_1.PayrollCumulativeService,
            cameroonpayrollcalculator_service_1.CameroonPayrollCalculatorService,
        ],
    })
], PayrollrecordModule);
//# sourceMappingURL=payrollrecord.module.js.map