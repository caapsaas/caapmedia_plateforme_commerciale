"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreHireTrainingModule = void 0;
const common_1 = require("@nestjs/common");
const pre_hire_training_controller_1 = require("./pre-hire-training.controller");
const pre_hire_training_service_1 = require("./pre-hire-training.service");
const employee_module_1 = require("../employee/employee.module");
let PreHireTrainingModule = class PreHireTrainingModule {
};
exports.PreHireTrainingModule = PreHireTrainingModule;
exports.PreHireTrainingModule = PreHireTrainingModule = __decorate([
    (0, common_1.Module)({ imports: [employee_module_1.EmployeeModule], controllers: [pre_hire_training_controller_1.PreHireTrainingController], providers: [pre_hire_training_service_1.PreHireTrainingService] })
], PreHireTrainingModule);
//# sourceMappingURL=pre-hire-training.module.js.map