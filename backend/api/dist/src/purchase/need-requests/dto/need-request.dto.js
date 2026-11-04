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
exports.ReviewNeedRequestDto = exports.NeedDecision = exports.CreateNeedRequestDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class CreateNeedRequestDto {
    title;
    description;
    estimatedBudget;
    desiredDate;
}
exports.CreateNeedRequestDto = CreateNeedRequestDto;
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.trim() : value),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateNeedRequestDto.prototype, "title", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.trim() : value),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(10),
    (0, class_validator_1.MaxLength)(10000),
    __metadata("design:type", String)
], CreateNeedRequestDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(9999999999999.99),
    __metadata("design:type", Number)
], CreateNeedRequestDto.prototype, "estimatedBudget", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({ strict: true }),
    __metadata("design:type", String)
], CreateNeedRequestDto.prototype, "desiredDate", void 0);
var NeedDecision;
(function (NeedDecision) {
    NeedDecision["APPROVED"] = "APPROVED";
    NeedDecision["REJECTED"] = "REJECTED";
})(NeedDecision || (exports.NeedDecision = NeedDecision = {}));
class ReviewNeedRequestDto {
    status;
    rejectionReason;
}
exports.ReviewNeedRequestDto = ReviewNeedRequestDto;
__decorate([
    (0, class_validator_1.IsEnum)(NeedDecision),
    __metadata("design:type", String)
], ReviewNeedRequestDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.trim() : value),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], ReviewNeedRequestDto.prototype, "rejectionReason", void 0);
//# sourceMappingURL=need-request.dto.js.map