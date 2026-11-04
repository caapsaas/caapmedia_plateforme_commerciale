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
exports.UpdateAbsenceRecordDto = exports.CreateAbsenceRecordDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const mapped_types_1 = require("@nestjs/mapped-types");
const client_1 = require("@prisma/client");
class CreateAbsenceRecordDto {
    employeeName;
    employeeId;
    startDate;
    endDate;
    reason;
    documentUrl;
    typeAbsence;
}
exports.CreateAbsenceRecordDto = CreateAbsenceRecordDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 255),
    __metadata("design:type", String)
], CreateAbsenceRecordDto.prototype, "employeeName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 255),
    __metadata("design:type", String)
], CreateAbsenceRecordDto.prototype, "employeeId", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Transform)(({ value }) => new Date(value)),
    __metadata("design:type", Date)
], CreateAbsenceRecordDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Transform)(({ value }) => new Date(value)),
    __metadata("design:type", Date)
], CreateAbsenceRecordDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAbsenceRecordDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAbsenceRecordDto.prototype, "documentUrl", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.AbsenceType),
    __metadata("design:type", String)
], CreateAbsenceRecordDto.prototype, "typeAbsence", void 0);
class UpdateAbsenceRecordDto extends (0, mapped_types_1.PartialType)(CreateAbsenceRecordDto) {
}
exports.UpdateAbsenceRecordDto = UpdateAbsenceRecordDto;
//# sourceMappingURL=absencerecord.dto.js.map