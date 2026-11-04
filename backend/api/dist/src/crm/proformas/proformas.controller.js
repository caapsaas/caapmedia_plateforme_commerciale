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
exports.ProformasController = void 0;
const common_1 = require("@nestjs/common");
const proformas_service_1 = require("./proformas.service");
const create_proforma_dto_1 = require("./dto/create-proforma.dto");
const update_proforma_dto_1 = require("./dto/update-proforma.dto");
const jwt_guard_1 = require("../../common/auth/jwt/jwt.guard");
const role_guard_1 = require("../../common/auth/role/role.guard");
const role_decorator_1 = require("../../common/auth/role/role.decorator");
const client_1 = require("@prisma/client");
const pagination_query_dto_1 = require("../../common/pagination/dto/pagination-query.dto");
const throttler_1 = require("@nestjs/throttler");
const proforma_delivery_service_1 = require("./proforma-delivery.service");
const send_proforma_email_dto_1 = require("./dto/send-proforma-email.dto");
let ProformasController = class ProformasController {
    proformasService;
    delivery;
    constructor(proformasService, delivery) {
        this.proformasService = proformasService;
        this.delivery = delivery;
    }
    email(id, user, dto) {
        return this.delivery.email(id, user, dto.expectedRecipient);
    }
    whatsapp(id, user) {
        return this.delivery.whatsapp(id, user);
    }
    create(createProformaDto, user) {
        return this.proformasService.create(createProformaDto, user);
    }
    findAll(user, paginationQuery, status) {
        return this.proformasService.findAll(user, paginationQuery, status);
    }
    getStatusCounts(user) {
        return this.proformasService.getStatusCounts(user);
    }
    findOne(id, user) {
        return this.proformasService.findOne(id, user);
    }
    update(id, updateProformaDto, user) {
        return this.proformasService.update(id, updateProformaDto, user);
    }
    send(id, user) {
        return this.proformasService.send(id, user);
    }
    markAsViewed(id, user) {
        return this.proformasService.markAsViewed(id, user);
    }
    accept(id, user) {
        return this.proformasService.accept(id, user);
    }
    reject(id, user) {
        return this.proformasService.reject(id, user);
    }
    remove(id, user) {
        return this.proformasService.remove(id, user);
    }
};
exports.ProformasController = ProformasController;
__decorate([
    (0, common_1.Post)(':id/email'),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60000 } }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, send_proforma_email_dto_1.SendProformaEmailDto]),
    __metadata("design:returntype", void 0)
], ProformasController.prototype, "email", null);
__decorate([
    (0, common_1.Post)(':id/whatsapp'),
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60000 } }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProformasController.prototype, "whatsapp", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_proforma_dto_1.CreateProformaDto, Object]),
    __metadata("design:returntype", void 0)
], ProformasController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, role_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pagination_query_dto_1.PaginationQueryDto, String]),
    __metadata("design:returntype", void 0)
], ProformasController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('status-counts'),
    __param(0, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProformasController.prototype, "getStatusCounts", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProformasController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_proforma_dto_1.UpdateProformaDto, Object]),
    __metadata("design:returntype", void 0)
], ProformasController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/send'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProformasController.prototype, "send", null);
__decorate([
    (0, common_1.Post)(':id/mark-viewed'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProformasController.prototype, "markAsViewed", null);
__decorate([
    (0, common_1.Post)(':id/accept'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProformasController.prototype, "accept", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProformasController.prototype, "reject", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProformasController.prototype, "remove", null);
exports.ProformasController = ProformasController = __decorate([
    (0, common_1.Controller)('crm/proformas'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.SECRETARY, client_1.UserRole.FINANCIAL_DIRECTOR),
    __metadata("design:paramtypes", [proformas_service_1.ProformasService,
        proforma_delivery_service_1.ProformaDeliveryService])
], ProformasController);
//# sourceMappingURL=proformas.controller.js.map