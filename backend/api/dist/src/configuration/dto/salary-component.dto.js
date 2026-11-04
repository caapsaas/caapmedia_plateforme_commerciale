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
exports.UpdateSalaryComponentDto = exports.CreateSalaryComponentDto = void 0;
const class_validator_1 = require("class-validator");
var SalaryComponentType;
(function (SalaryComponentType) {
    SalaryComponentType["EARNING"] = "EARNING";
    SalaryComponentType["DEDUCTION"] = "DEDUCTION";
    SalaryComponentType["TAX"] = "TAX";
    SalaryComponentType["CONTRIBUTION"] = "CONTRIBUTION";
})(SalaryComponentType || (SalaryComponentType = {}));
var ContributionType;
(function (ContributionType) {
    ContributionType["EMPLOYEE"] = "EMPLOYEE";
    ContributionType["EMPLOYER"] = "EMPLOYER";
    ContributionType["BOTH"] = "BOTH";
})(ContributionType || (ContributionType = {}));
class CreateSalaryComponentDto {
    name;
    description;
    type;
    rate;
    fixedAmount;
    contributionType;
    displayOrder;
}
exports.CreateSalaryComponentDto = CreateSalaryComponentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSalaryComponentDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSalaryComponentDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(SalaryComponentType),
    __metadata("design:type", String)
], CreateSalaryComponentDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateSalaryComponentDto.prototype, "rate", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateSalaryComponentDto.prototype, "fixedAmount", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(ContributionType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSalaryComponentDto.prototype, "contributionType", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateSalaryComponentDto.prototype, "displayOrder", void 0);
class UpdateSalaryComponentDto {
    name;
    description;
    type;
    rate;
    fixedAmount;
    contributionType;
    isActive;
    displayOrder;
}
exports.UpdateSalaryComponentDto = UpdateSalaryComponentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSalaryComponentDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSalaryComponentDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(SalaryComponentType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSalaryComponentDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateSalaryComponentDto.prototype, "rate", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateSalaryComponentDto.prototype, "fixedAmount", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(ContributionType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSalaryComponentDto.prototype, "contributionType", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateSalaryComponentDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateSalaryComponentDto.prototype, "displayOrder", void 0);
//# sourceMappingURL=salary-component.dto.js.map