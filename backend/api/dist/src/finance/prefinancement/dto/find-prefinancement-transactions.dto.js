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
exports.FindPrefinancementTransactionsDto = void 0;
const class_validator_1 = require("class-validator");
const pagination_query_dto_1 = require("../../../common/pagination/dto/pagination-query.dto");
class FindPrefinancementTransactionsDto extends pagination_query_dto_1.PaginationQueryDto {
    subsidiaryId;
    type;
    category;
    status;
    startDate;
    endDate;
}
exports.FindPrefinancementTransactionsDto = FindPrefinancementTransactionsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FindPrefinancementTransactionsDto.prototype, "subsidiaryId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['CREDIT', 'DEBIT']),
    __metadata("design:type", String)
], FindPrefinancementTransactionsDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['MATERIELS_PREMIER', 'MAIN_D_OEUVRE', 'ENERGIE', 'TRANSPORT', 'AUTRE']),
    __metadata("design:type", String)
], FindPrefinancementTransactionsDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['VALIDE', 'EN_ATTENTE', 'ANNULE']),
    __metadata("design:type", String)
], FindPrefinancementTransactionsDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FindPrefinancementTransactionsDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FindPrefinancementTransactionsDto.prototype, "endDate", void 0);
//# sourceMappingURL=find-prefinancement-transactions.dto.js.map