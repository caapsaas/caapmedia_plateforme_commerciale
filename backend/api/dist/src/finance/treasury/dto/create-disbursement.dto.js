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
exports.CreateDisbursementDto = void 0;
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class CreateDisbursementDto {
    transactionDate;
    description;
    amount;
    sourceAccountId;
    destinationAccountId;
    treasuryType;
    reference;
    counterpartyId;
    newCounterpartyName;
    newCounterpartyType;
    status;
}
exports.CreateDisbursementDto = CreateDisbursementDto;
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDisbursementDto.prototype, "transactionDate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDisbursementDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CreateDisbursementDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDisbursementDto.prototype, "sourceAccountId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDisbursementDto.prototype, "destinationAccountId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.TreasuryTransactionType),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDisbursementDto.prototype, "treasuryType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateDisbursementDto.prototype, "reference", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDisbursementDto.prototype, "counterpartyId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateDisbursementDto.prototype, "newCounterpartyName", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.CounterpartyType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDisbursementDto.prototype, "newCounterpartyType", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.TransactionStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateDisbursementDto.prototype, "status", void 0);
//# sourceMappingURL=create-disbursement.dto.js.map