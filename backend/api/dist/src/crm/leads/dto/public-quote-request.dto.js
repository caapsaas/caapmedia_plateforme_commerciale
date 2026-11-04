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
exports.PublicQuoteRequestDto = void 0;
const class_validator_1 = require("class-validator");
class PublicQuoteRequestDto {
    leadName;
    company;
    email;
    phone;
    description;
}
exports.PublicQuoteRequestDto = PublicQuoteRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le nom est requis.' }),
    __metadata("design:type", String)
], PublicQuoteRequestDto.prototype, "leadName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: "Le nom de l'entreprise est requis." }),
    __metadata("design:type", String)
], PublicQuoteRequestDto.prototype, "company", void 0);
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: "L'adresse email doit être valide." }),
    (0, class_validator_1.IsNotEmpty)({ message: "L'adresse email est requise." }),
    __metadata("design:type", String)
], PublicQuoteRequestDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le numéro de téléphone est requis.' }),
    __metadata("design:type", String)
], PublicQuoteRequestDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PublicQuoteRequestDto.prototype, "description", void 0);
//# sourceMappingURL=public-quote-request.dto.js.map