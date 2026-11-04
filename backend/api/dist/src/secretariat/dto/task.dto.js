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
exports.SearchSecretariatTasksDto = exports.UpdateSecretariatTaskDto = exports.CreateSecretariatTaskDto = void 0;
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
const pagination_query_dto_1 = require("../../common/pagination/dto/pagination-query.dto");
class CreateSecretariatTaskDto {
    title;
    description;
    dueDate;
    status;
    assignedToId;
    subsidiaryId;
}
exports.CreateSecretariatTaskDto = CreateSecretariatTaskDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSecretariatTaskDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSecretariatTaskDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateSecretariatTaskDto.prototype, "dueDate", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.SecretariatTaskStatus),
    __metadata("design:type", String)
], CreateSecretariatTaskDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSecretariatTaskDto.prototype, "assignedToId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSecretariatTaskDto.prototype, "subsidiaryId", void 0);
class UpdateSecretariatTaskDto {
    title;
    description;
    dueDate;
    status;
    assignedToId;
}
exports.UpdateSecretariatTaskDto = UpdateSecretariatTaskDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSecretariatTaskDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSecretariatTaskDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateSecretariatTaskDto.prototype, "dueDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.SecretariatTaskStatus),
    __metadata("design:type", String)
], UpdateSecretariatTaskDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSecretariatTaskDto.prototype, "assignedToId", void 0);
class SearchSecretariatTasksDto extends pagination_query_dto_1.PaginationQueryDto {
    title;
    status;
    dueDate;
}
exports.SearchSecretariatTasksDto = SearchSecretariatTasksDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchSecretariatTasksDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.SecretariatTaskStatus),
    __metadata("design:type", String)
], SearchSecretariatTasksDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], SearchSecretariatTasksDto.prototype, "dueDate", void 0);
//# sourceMappingURL=task.dto.js.map