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
exports.FindMaintenanceRecordsDto = exports.SearchMaintenanceRecordDto = exports.UpdateMaintenanceRecordDto = exports.CreateMaintenanceRecordDto = void 0;
const class_validator_1 = require("class-validator");
const mapped_types_1 = require("@nestjs/mapped-types");
const pagination_query_dto_1 = require("../../../common/pagination/dto/pagination-query.dto");
class CreateMaintenanceRecordDto {
    maintenanceDate;
    technician;
    description;
    maintenanceCost;
    equipmentId;
}
exports.CreateMaintenanceRecordDto = CreateMaintenanceRecordDto;
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateMaintenanceRecordDto.prototype, "maintenanceDate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMaintenanceRecordDto.prototype, "technician", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMaintenanceRecordDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateMaintenanceRecordDto.prototype, "maintenanceCost", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMaintenanceRecordDto.prototype, "equipmentId", void 0);
class UpdateMaintenanceRecordDto extends (0, mapped_types_1.PartialType)(CreateMaintenanceRecordDto) {
}
exports.UpdateMaintenanceRecordDto = UpdateMaintenanceRecordDto;
class SearchMaintenanceRecordDto extends pagination_query_dto_1.PaginationQueryDto {
    equipmentId;
    fromDate;
    toDate;
    technician;
}
exports.SearchMaintenanceRecordDto = SearchMaintenanceRecordDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchMaintenanceRecordDto.prototype, "equipmentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], SearchMaintenanceRecordDto.prototype, "fromDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], SearchMaintenanceRecordDto.prototype, "toDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchMaintenanceRecordDto.prototype, "technician", void 0);
class FindMaintenanceRecordsDto extends pagination_query_dto_1.PaginationQueryDto {
    equipmentId;
}
exports.FindMaintenanceRecordsDto = FindMaintenanceRecordsDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], FindMaintenanceRecordsDto.prototype, "equipmentId", void 0);
//# sourceMappingURL=create-maintenance_record.dto.js.map