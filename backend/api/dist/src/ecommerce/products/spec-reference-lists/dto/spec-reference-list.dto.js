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
exports.UpdateReferenceValueDto = exports.CreateReferenceValueDto = exports.UpdateReferenceListDto = exports.CreateReferenceListDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const class_validator_1 = require("class-validator");
class CreateReferenceListDto {
    key;
    name;
}
exports.CreateReferenceListDto = CreateReferenceListDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Matches)(/^[a-z][a-z0-9_]*$/, {
        message: 'key doit être en snake_case (lettres minuscules, chiffres, underscores)',
    }),
    __metadata("design:type", String)
], CreateReferenceListDto.prototype, "key", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateReferenceListDto.prototype, "name", void 0);
class UpdateReferenceListDto extends (0, mapped_types_1.PartialType)(CreateReferenceListDto) {
}
exports.UpdateReferenceListDto = UpdateReferenceListDto;
class CreateReferenceValueDto {
    value;
    label;
    order;
}
exports.CreateReferenceValueDto = CreateReferenceValueDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateReferenceValueDto.prototype, "value", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateReferenceValueDto.prototype, "label", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateReferenceValueDto.prototype, "order", void 0);
class UpdateReferenceValueDto extends (0, mapped_types_1.PartialType)(CreateReferenceValueDto) {
}
exports.UpdateReferenceValueDto = UpdateReferenceValueDto;
//# sourceMappingURL=spec-reference-list.dto.js.map