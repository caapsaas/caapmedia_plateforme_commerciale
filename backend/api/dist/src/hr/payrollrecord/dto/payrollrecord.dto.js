"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePayrollRecordDto = exports.CreatePayrollRecordDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const mapped_types_1 = require("@nestjs/mapped-types");
const client_1 = require("@prisma/client");
class CreatePayrollRecordDto {
    employeeName;
    employeeId;
    payrollPeriod;
    baseSalary;
    bonus;
    allowances;
    overtime;
    otherEarnings;
    grossSalary;
    cnpsEmployee;
    cfcEmployee;
    irpp;
    cac;
    otherDeductions;
    deductions;
    cnpsEmployer;
    cfcEmployer;
    fne;
    totalEmployerCost;
    netSalary;
    paymentDate;
    signature;
    deductionsDetail;
    notes;
    status;
}
exports.CreatePayrollRecordDto = CreatePayrollRecordDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 255),
    __metadata("design:type", String)
], CreatePayrollRecordDto.prototype, "employeeName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 255),
    __metadata("design:type", String)
], CreatePayrollRecordDto.prototype, "employeeId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 7),
    __metadata("design:type", String)
], CreatePayrollRecordDto.prototype, "payrollPeriod", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDecimal)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreatePayrollRecordDto.prototype, "baseSalary", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDecimal)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreatePayrollRecordDto.prototype, "bonus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDecimal)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreatePayrollRecordDto.prototype, "allowances", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDecimal)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreatePayrollRecordDto.prototype, "overtime", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDecimal)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreatePayrollRecordDto.prototype, "otherEarnings", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDecimal)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreatePayrollRecordDto.prototype, "grossSalary", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDecimal)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreatePayrollRecordDto.prototype, "cnpsEmployee", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDecimal)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreatePayrollRecordDto.prototype, "cfcEmployee", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDecimal)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreatePayrollRecordDto.prototype, "irpp", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDecimal)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreatePayrollRecordDto.prototype, "cac", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDecimal)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreatePayrollRecordDto.prototype, "otherDeductions", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDecimal)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreatePayrollRecordDto.prototype, "deductions", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDecimal)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreatePayrollRecordDto.prototype, "cnpsEmployer", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDecimal)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreatePayrollRecordDto.prototype, "cfcEmployer", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDecimal)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreatePayrollRecordDto.prototype, "fne", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDecimal)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreatePayrollRecordDto.prototype, "totalEmployerCost", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDecimal)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreatePayrollRecordDto.prototype, "netSalary", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Transform)(({ value }) => (value ? new Date(value) : null)),
    __metadata("design:type", Date)
], CreatePayrollRecordDto.prototype, "paymentDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePayrollRecordDto.prototype, "signature", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreatePayrollRecordDto.prototype, "deductionsDetail", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePayrollRecordDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.PayrollStatus),
    __metadata("design:type", String)
], CreatePayrollRecordDto.prototype, "status", void 0);
class UpdatePayrollRecordDto extends (0, mapped_types_1.PartialType)(CreatePayrollRecordDto) {
}
exports.UpdatePayrollRecordDto = UpdatePayrollRecordDto;
//# sourceMappingURL=payrollrecord.dto.js.map