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
exports.CreateContactDto = void 0;
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class CreateContactDto {
    contactName;
    company;
    email;
    phone;
    address;
    status;
    accountId;
    subsidiaryId;
    since;
}
exports.CreateContactDto = CreateContactDto;
__decorate([
    (0, class_validator_1.IsString)({
        message: 'Le nom du contact doit être une chaîne de caractères.',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le nom du contact est obligatoire.' }),
    __metadata("design:type", String)
], CreateContactDto.prototype, "contactName", void 0);
__decorate([
    (0, class_validator_1.IsString)({
        message: 'Le nom de l’entreprise doit être une chaîne de caractères.',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le nom de l’entreprise est obligatoire.' }),
    __metadata("design:type", String)
], CreateContactDto.prototype, "company", void 0);
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: 'L’adresse e-mail fournie est invalide.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'L’adresse e-mail est obligatoire.' }),
    __metadata("design:type", String)
], CreateContactDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)({
        message: 'Le numéro de téléphone doit être une chaîne de caractères.',
    }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le numéro de téléphone est obligatoire.' }),
    __metadata("design:type", String)
], CreateContactDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'L’adresse doit être une chaîne de caractères.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'L’adresse est obligatoire.' }),
    __metadata("design:type", String)
], CreateContactDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.ContactStatus, {
        message: 'Le statut du contact doit être une valeur valide de ContactStatus.',
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateContactDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateContactDto.prototype, "accountId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateContactDto.prototype, "subsidiaryId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], CreateContactDto.prototype, "since", void 0);
//# sourceMappingURL=create-contact.dto.js.map