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
exports.UpdatePayrollConfigDto = exports.CreatePayrollConfigDto = exports.LeaveEntitlementDto = exports.TaxBracketDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class TaxBracketDto {
    minSalary;
    maxSalary;
    rate;
    deductible;
}
exports.TaxBracketDto = TaxBracketDto;
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'Le salaire minimum doit être un nombre' }),
    (0, class_validator_1.Min)(0, { message: 'Le salaire minimum ne peut pas être négatif' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], TaxBracketDto.prototype, "minSalary", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'Le salaire maximum doit être un nombre' }),
    (0, class_validator_1.Min)(0, { message: 'Le salaire maximum ne peut pas être négatif' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], TaxBracketDto.prototype, "maxSalary", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'Le taux doit être un nombre' }),
    (0, class_validator_1.Min)(0, { message: 'Le taux ne peut pas être négatif' }),
    (0, class_validator_1.Max)(1, { message: 'Le taux ne peut pas dépasser 100%' }),
    __metadata("design:type", Number)
], TaxBracketDto.prototype, "rate", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'La déduction doit être un nombre' }),
    (0, class_validator_1.Min)(0, { message: 'La déduction ne peut pas être négative' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], TaxBracketDto.prototype, "deductible", void 0);
class LeaveEntitlementDto {
    type;
    daysPerYear;
    isPaid;
    description;
}
exports.LeaveEntitlementDto = LeaveEntitlementDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LeaveEntitlementDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0, { message: 'Les jours de congé ne peuvent pas être négatifs' }),
    (0, class_validator_1.Max)(365, { message: 'Les jours de congé ne peuvent pas dépasser 365' }),
    __metadata("design:type", Number)
], LeaveEntitlementDto.prototype, "daysPerYear", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], LeaveEntitlementDto.prototype, "isPaid", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], LeaveEntitlementDto.prototype, "description", void 0);
class CreatePayrollConfigDto {
    subsidiaryId;
    minWage;
    minWagePeriod;
    minWageEffectiveDate;
    cnpsEmployeeRate;
    cnpsEmployerRate;
}
exports.CreatePayrollConfigDto = CreatePayrollConfigDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePayrollConfigDto.prototype, "subsidiaryId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(41875, { message: 'Le salaire minimum configuré est inférieur au plancher légal de 41875 FCFA' }),
    (0, class_validator_1.Max)(500000, {
        message: 'Le salaire minimum ne peut pas dépasser 500000 FCFA',
    }),
    __metadata("design:type", Number)
], CreatePayrollConfigDto.prototype, "minWage", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePayrollConfigDto.prototype, "minWagePeriod", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], CreatePayrollConfigDto.prototype, "minWageEffectiveDate", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 4 }),
    (0, class_validator_1.Min)(0, { message: 'Le taux CNPS employé ne peut pas être négatif' }),
    (0, class_validator_1.Max)(0.2, { message: 'Le taux CNPS employé ne peut pas dépasser 20%' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreatePayrollConfigDto.prototype, "cnpsEmployeeRate", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 4 }),
    (0, class_validator_1.Min)(0, { message: 'Le taux CNPS employeur ne peut pas être négatif' }),
    (0, class_validator_1.Max)(0.3, { message: 'Le taux CNPS employeur ne peut pas dépasser 30%' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreatePayrollConfigDto.prototype, "cnpsEmployerRate", void 0);
class UpdatePayrollConfigDto {
    minWage;
    minWagePeriod;
    minWageEffectiveDate;
    cnpsEmployeeRate;
    cnpsEmployerRate;
    cfcEmployeeRate;
    cfcEmployerRate;
    fneRate;
    cnpsCap;
    professionalExpenseRate;
    fixedAbatementAnnual;
    riskGroupARate;
    riskGroupBRate;
    riskGroupCRate;
    irppBrackets;
    leaveEntitlements;
}
exports.UpdatePayrollConfigDto = UpdatePayrollConfigDto;
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'Le salaire minimum doit être un nombre' }),
    (0, class_validator_1.Min)(41875, { message: 'Le salaire minimum configuré est inférieur au plancher légal de 41875 FCFA' }),
    (0, class_validator_1.Max)(500000, {
        message: 'Le salaire minimum ne peut pas dépasser 500000 FCFA',
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdatePayrollConfigDto.prototype, "minWage", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePayrollConfigDto.prototype, "minWagePeriod", void 0);
__decorate([
    (0, class_validator_1.Matches)(/^\d{4}-\d{2}-\d{2}$/, {
        message: 'La date doit être au format YYYY-MM-DD',
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdatePayrollConfigDto.prototype, "minWageEffectiveDate", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'Le taux CNPS employé doit être un nombre' }),
    (0, class_validator_1.Min)(0, { message: 'Le taux CNPS employé ne peut pas être négatif' }),
    (0, class_validator_1.Max)(0.2, { message: 'Le taux CNPS employé ne peut pas dépasser 20%' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdatePayrollConfigDto.prototype, "cnpsEmployeeRate", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'Le taux CNPS employeur doit être un nombre' }),
    (0, class_validator_1.Min)(0, { message: 'Le taux CNPS employeur ne peut pas être négatif' }),
    (0, class_validator_1.Max)(0.3, { message: 'Le taux CNPS employeur ne peut pas dépasser 30%' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdatePayrollConfigDto.prototype, "cnpsEmployerRate", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'Le taux CFC employé doit être un nombre' }),
    (0, class_validator_1.Min)(0, { message: 'Le taux CFC employé ne peut pas être négatif' }),
    (0, class_validator_1.Max)(0.2, { message: 'Le taux CFC employé ne peut pas dépasser 20%' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdatePayrollConfigDto.prototype, "cfcEmployeeRate", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'Le taux CFC employeur doit être un nombre' }),
    (0, class_validator_1.Min)(0, { message: 'Le taux CFC employeur ne peut pas être négatif' }),
    (0, class_validator_1.Max)(0.3, { message: 'Le taux CFC employeur ne peut pas dépasser 30%' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdatePayrollConfigDto.prototype, "cfcEmployerRate", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'Le taux FNE doit être un nombre' }),
    (0, class_validator_1.Min)(0, { message: 'Le taux FNE ne peut pas être négatif' }),
    (0, class_validator_1.Max)(0.1, { message: 'Le taux FNE ne peut pas dépasser 10%' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdatePayrollConfigDto.prototype, "fneRate", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'Le plafond CNPS doit être un nombre' }),
    (0, class_validator_1.Min)(0, { message: 'Le plafond CNPS ne peut pas être négatif' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdatePayrollConfigDto.prototype, "cnpsCap", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: "Le taux d'abattement professionnel doit être un nombre" }),
    (0, class_validator_1.Min)(0, {
        message: "Le taux d'abattement professionnel ne peut pas être négatif",
    }),
    (0, class_validator_1.Max)(1, {
        message: "Le taux d'abattement professionnel ne peut pas dépasser 100%",
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdatePayrollConfigDto.prototype, "professionalExpenseRate", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: "L'abattement fixe annuel doit être un nombre" }),
    (0, class_validator_1.Min)(0, { message: "L'abattement fixe annuel ne peut pas être négatif" }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdatePayrollConfigDto.prototype, "fixedAbatementAnnual", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'Le taux du groupe A doit être un nombre' }),
    (0, class_validator_1.Min)(0, { message: 'Le taux du groupe A ne peut pas être négatif' }),
    (0, class_validator_1.Max)(0.1, { message: 'Le taux du groupe A ne peut pas dépasser 10%' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdatePayrollConfigDto.prototype, "riskGroupARate", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'Le taux du groupe B doit être un nombre' }),
    (0, class_validator_1.Min)(0, { message: 'Le taux du groupe B ne peut pas être négatif' }),
    (0, class_validator_1.Max)(0.15, { message: 'Le taux du groupe B ne peut pas dépasser 15%' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdatePayrollConfigDto.prototype, "riskGroupBRate", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'Le taux du groupe C doit être un nombre' }),
    (0, class_validator_1.Min)(0, { message: 'Le taux du groupe C ne peut pas être négatif' }),
    (0, class_validator_1.Max)(0.2, { message: 'Le taux du groupe C ne peut pas dépasser 20%' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdatePayrollConfigDto.prototype, "riskGroupCRate", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => TaxBracketDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdatePayrollConfigDto.prototype, "irppBrackets", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => LeaveEntitlementDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdatePayrollConfigDto.prototype, "leaveEntitlements", void 0);
//# sourceMappingURL=payroll-configuration.dto.js.map