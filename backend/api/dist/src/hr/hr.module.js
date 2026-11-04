"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HrModule = void 0;
const common_1 = require("@nestjs/common");
const employee_module_1 = require("./employee/employee.module");
const attendancerecord_module_1 = require("./attendancerecord/attendancerecord.module");
const payrollrecord_module_1 = require("./payrollrecord/payrollrecord.module");
const absencerecord_module_1 = require("./absencerecord/absencerecord.module");
const pre_hire_training_module_1 = require("./pre-hire-training/pre-hire-training.module");
let HrModule = class HrModule {
};
exports.HrModule = HrModule;
exports.HrModule = HrModule = __decorate([
    (0, common_1.Module)({
        imports: [
            employee_module_1.EmployeeModule,
            attendancerecord_module_1.AttendancerecordModule,
            payrollrecord_module_1.PayrollrecordModule,
            absencerecord_module_1.AbsencerecordModule,
            pre_hire_training_module_1.PreHireTrainingModule,
        ],
    })
], HrModule);
//# sourceMappingURL=hr.module.js.map