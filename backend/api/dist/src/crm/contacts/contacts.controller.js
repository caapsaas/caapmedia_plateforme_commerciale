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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactsController = void 0;
const common_1 = require("@nestjs/common");
const contacts_service_1 = require("./contacts.service");
const role_guard_1 = require("../../common/auth/role/role.guard");
const create_contact_dto_1 = require("./dto/create-contact.dto");
const update_contact_dto_1 = require("./dto/update-contact.dto");
const jwt_guard_1 = require("../../common/auth/jwt/jwt.guard");
const role_decorator_1 = require("../../common/auth/role/role.decorator");
const client_1 = require("@prisma/client");
const register_contact_dto_1 = require("./dto/register-contact.dto");
const contact_login_dto_1 = require("./dto/contact-login.dto");
const contact_jwt_guard_1 = require("../../common/auth/jwt/contact-jwt.guard");
const pagination_query_dto_1 = require("../../common/pagination/dto/pagination-query.dto");
let ContactsController = class ContactsController {
    contactsService;
    constructor(contactsService) {
        this.contactsService = contactsService;
    }
    async registerContact(registerContactDto) {
        return this.contactsService.register(registerContactDto);
    }
    async loginContact(contactLoginDto) {
        return this.contactsService.loginContact(contactLoginDto);
    }
    logoutContact() {
        return this.contactsService.logoutContact();
    }
    getContactProfile(contact) {
        return this.contactsService.getContactProfile(contact);
    }
    getContactOrders(contact, paginationQuery) {
        return this.contactsService.getContactOrders(contact.id, paginationQuery);
    }
    create(createContactDto, user) {
        return this.contactsService.create(createContactDto, user);
    }
    findAll(user, paginationQuery, filterSubsidiaryId, filterSalesRepId) {
        return this.contactsService.findAll(user, paginationQuery, filterSubsidiaryId, filterSalesRepId);
    }
    searchGlobal(query, paginationQuery) {
        return this.contactsService.searchGlobal(query, paginationQuery);
    }
    findPublic(id) {
        return this.contactsService.findPublic(id);
    }
    findOne(id, user) {
        return this.contactsService.findOne(id, user);
    }
    update(id, updateContactDto, user) {
        return this.contactsService.update(id, updateContactDto, user);
    }
    remove(id, user) {
        return this.contactsService.remove(id, user);
    }
    resetPassword(id, user) {
        return this.contactsService.resetContactPassword(id, user);
    }
    enablePortalAccess(id, user) {
        return this.contactsService.enablePortalAccess(id, user);
    }
};
exports.ContactsController = ContactsController;
__decorate([
    (0, common_1.Post)('register'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_contact_dto_1.RegisterContactDto]),
    __metadata("design:returntype", Promise)
], ContactsController.prototype, "registerContact", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [contact_login_dto_1.ContactLoginDto]),
    __metadata("design:returntype", Promise)
], ContactsController.prototype, "loginContact", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ContactsController.prototype, "logoutContact", null);
__decorate([
    (0, common_1.UseGuards)(contact_jwt_guard_1.ContactJwtAuthGuard),
    (0, common_1.Get)('profile'),
    __param(0, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ContactsController.prototype, "getContactProfile", null);
__decorate([
    (0, common_1.UseGuards)(contact_jwt_guard_1.ContactJwtAuthGuard),
    (0, common_1.Get)('orders'),
    __param(0, (0, role_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", void 0)
], ContactsController.prototype, "getContactOrders", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.SECRETARY, client_1.UserRole.FINANCIAL_DIRECTOR, client_1.UserRole.CAISSIER, client_1.UserRole.PURCHASING_MANAGER, client_1.UserRole.HR_MANAGER, client_1.UserRole.PRODUCTION_DIRECTOR),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_contact_dto_1.CreateContactDto, Object]),
    __metadata("design:returntype", void 0)
], ContactsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.SECRETARY, client_1.UserRole.FINANCIAL_DIRECTOR, client_1.UserRole.CAISSIER, client_1.UserRole.PURCHASING_MANAGER, client_1.UserRole.HR_MANAGER, client_1.UserRole.PRODUCTION_DIRECTOR),
    __param(0, (0, role_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Query)('subsidiaryId')),
    __param(3, (0, common_1.Query)('salesRepId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pagination_query_dto_1.PaginationQueryDto, String, String]),
    __metadata("design:returntype", void 0)
], ContactsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.SECRETARY, client_1.UserRole.FINANCIAL_DIRECTOR, client_1.UserRole.CAISSIER, client_1.UserRole.PURCHASING_MANAGER, client_1.UserRole.HR_MANAGER, client_1.UserRole.PRODUCTION_DIRECTOR),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", void 0)
], ContactsController.prototype, "searchGlobal", null);
__decorate([
    (0, common_1.Get)('public/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ContactsController.prototype, "findPublic", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.SECRETARY, client_1.UserRole.FINANCIAL_DIRECTOR, client_1.UserRole.CAISSIER, client_1.UserRole.PURCHASING_MANAGER, client_1.UserRole.HR_MANAGER, client_1.UserRole.PRODUCTION_DIRECTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ContactsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.SECRETARY, client_1.UserRole.FINANCIAL_DIRECTOR, client_1.UserRole.CAISSIER, client_1.UserRole.PURCHASING_MANAGER, client_1.UserRole.HR_MANAGER, client_1.UserRole.PRODUCTION_DIRECTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_contact_dto_1.UpdateContactDto, Object]),
    __metadata("design:returntype", void 0)
], ContactsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.SECRETARY, client_1.UserRole.FINANCIAL_DIRECTOR, client_1.UserRole.CAISSIER, client_1.UserRole.PURCHASING_MANAGER, client_1.UserRole.HR_MANAGER, client_1.UserRole.PRODUCTION_DIRECTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ContactsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/reset-password'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.SECRETARY, client_1.UserRole.FINANCIAL_DIRECTOR, client_1.UserRole.CAISSIER, client_1.UserRole.PURCHASING_MANAGER, client_1.UserRole.HR_MANAGER, client_1.UserRole.PRODUCTION_DIRECTOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ContactsController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Post)(':id/enable-portal'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.SECRETARY, client_1.UserRole.FINANCIAL_DIRECTOR, client_1.UserRole.CAISSIER, client_1.UserRole.PURCHASING_MANAGER, client_1.UserRole.HR_MANAGER, client_1.UserRole.PRODUCTION_DIRECTOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ContactsController.prototype, "enablePortalAccess", null);
exports.ContactsController = ContactsController = __decorate([
    (0, common_1.Controller)('crm/contacts'),
    __metadata("design:paramtypes", [contacts_service_1.ContactsService])
], ContactsController);
//# sourceMappingURL=contacts.controller.js.map