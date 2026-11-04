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
exports.CreateExternalTransactionDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class CreateExternalTransactionDto {
    transactionDate;
    description;
    amount;
    externalTransactionType;
    externalTransactionCategory;
    paymentMethod;
    referenceNumber;
    createdBy;
    subsidiaryId;
}
exports.CreateExternalTransactionDto = CreateExternalTransactionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Date de la transaction (YYYY-MM-DD)' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateExternalTransactionDto.prototype, "transactionDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Description de la transaction' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateExternalTransactionDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Montant de la transaction' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateExternalTransactionDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: client_1.ExternalTransactionType,
        description: 'Type de transaction externe',
    }),
    (0, class_validator_1.IsEnum)(client_1.ExternalTransactionType),
    __metadata("design:type", String)
], CreateExternalTransactionDto.prototype, "externalTransactionType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: client_1.ExternalTransactionCategory,
        description: 'Catégorie de la transaction',
    }),
    (0, class_validator_1.IsEnum)(client_1.ExternalTransactionCategory),
    __metadata("design:type", String)
], CreateExternalTransactionDto.prototype, "externalTransactionCategory", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: client_1.PaymentMethod,
        description: 'Méthode de paiement',
    }),
    (0, class_validator_1.IsEnum)(client_1.PaymentMethod),
    __metadata("design:type", String)
], CreateExternalTransactionDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Numéro de référence' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateExternalTransactionDto.prototype, "referenceNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "ID de l'utilisateur qui crée la transaction" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateExternalTransactionDto.prototype, "createdBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID de la filiale' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateExternalTransactionDto.prototype, "subsidiaryId", void 0);
//# sourceMappingURL=create-external-transaction.dto.js.map