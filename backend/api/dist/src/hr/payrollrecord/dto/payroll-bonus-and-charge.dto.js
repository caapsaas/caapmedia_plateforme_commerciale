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
exports.CreateSalaryChargeDto = exports.RecordChargePaymentDto = exports.AccumulateChargesDto = exports.CancelBonusDto = exports.RecordBonusPaymentDto = exports.ApproveBonusDto = exports.GenerateThirteenthMonthDto = void 0;
const class_validator_1 = require("class-validator");
class GenerateThirteenthMonthDto {
    employeeId;
    month;
    year;
}
exports.GenerateThirteenthMonthDto = GenerateThirteenthMonthDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateThirteenthMonthDto.prototype, "employeeId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateThirteenthMonthDto.prototype, "month", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateThirteenthMonthDto.prototype, "year", void 0);
class ApproveBonusDto {
    bonusId;
}
exports.ApproveBonusDto = ApproveBonusDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ApproveBonusDto.prototype, "bonusId", void 0);
class RecordBonusPaymentDto {
    bonusId;
    bankTransferId;
    paymentDate;
}
exports.RecordBonusPaymentDto = RecordBonusPaymentDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], RecordBonusPaymentDto.prototype, "bonusId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecordBonusPaymentDto.prototype, "bankTransferId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RecordBonusPaymentDto.prototype, "paymentDate", void 0);
class CancelBonusDto {
    bonusId;
    reason;
}
exports.CancelBonusDto = CancelBonusDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CancelBonusDto.prototype, "bonusId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CancelBonusDto.prototype, "reason", void 0);
class AccumulateChargesDto {
    month;
    subsidiaryId;
}
exports.AccumulateChargesDto = AccumulateChargesDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AccumulateChargesDto.prototype, "month", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AccumulateChargesDto.prototype, "subsidiaryId", void 0);
class RecordChargePaymentDto {
    chargePaymentId;
    bankTransferId;
    paidAmount;
    declarationNumber;
}
exports.RecordChargePaymentDto = RecordChargePaymentDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], RecordChargePaymentDto.prototype, "chargePaymentId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecordChargePaymentDto.prototype, "bankTransferId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], RecordChargePaymentDto.prototype, "paidAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecordChargePaymentDto.prototype, "declarationNumber", void 0);
class CreateSalaryChargeDto {
    month;
    paymentMethod;
    subsidiaryId;
}
exports.CreateSalaryChargeDto = CreateSalaryChargeDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSalaryChargeDto.prototype, "month", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSalaryChargeDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSalaryChargeDto.prototype, "subsidiaryId", void 0);
//# sourceMappingURL=payroll-bonus-and-charge.dto.js.map