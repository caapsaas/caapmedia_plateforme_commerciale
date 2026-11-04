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
exports.OrdersController = void 0;
const order_design_upload_interceptor_1 = require("./order-design-upload.interceptor");
const common_1 = require("@nestjs/common");
const orders_service_1 = require("./orders.service");
const contact_jwt_guard_1 = require("../../common/auth/jwt/contact-jwt.guard");
const jwt_guard_1 = require("../../common/auth/jwt/jwt.guard");
const role_guard_1 = require("../../common/auth/role/role.guard");
const role_decorator_1 = require("../../common/auth/role/role.decorator");
const create_order_dto_1 = require("./dto/create-order.dto");
const find_all_orders_dto_1 = require("./dto/find-all-orders.dto");
const client_1 = require("@prisma/client");
const pagination_query_dto_1 = require("../../common/pagination/dto/pagination-query.dto");
let OrdersController = class OrdersController {
    ordersService;
    constructor(ordersService) {
        this.ordersService = ordersService;
    }
    createBySalesRep(createOrderDto, files, req) {
        return this.ordersService.createBySalesRep(createOrderDto, req.user, files?.designFiles);
    }
    createBySalesRepJson(createOrderDto, req) {
        return this.ordersService.createBySalesRep(createOrderDto, req.user, []);
    }
    findAll(query, req) {
        return this.ordersService.findAll(req.user, query);
    }
    findPendingValidation(req, paginationQuery, subsidiaryId) {
        return this.ordersService.findPendingValidation(req.user, subsidiaryId, paginationQuery);
    }
    validateForProduction(id, req) {
        return this.ordersService.validateForProduction(id, req.user);
    }
    rejectOrder(id, req) {
        return this.ordersService.rejectByProductionDirector(id, req.user);
    }
    findTopSellingProducts(query, req) {
        return this.ordersService.getBestSellingProducts(req.user, query);
    }
    findPaymentAccounts(req) {
        return this.ordersService.findPaymentAccounts(req.user);
    }
    findStaffOrder(id, req) {
        return this.ordersService.findOne(id, req.user);
    }
    findOne(id, req) {
        return this.ordersService.findOneForCustomer(id, req.user);
    }
    findByCustomer(customerId, req) {
        return this.ordersService.findGroupsByCustomer(customerId, req.user);
    }
    updateOrderStatus(id, updateOrderStatusDto, req) {
        return this.ordersService.updateOrderStatus(id, updateOrderStatusDto, req.user);
    }
    updateProductionStatus(id, updateProductionStatusDto, req) {
        return this.ordersService.updateProductionStatus(id, updateProductionStatusDto, req.user);
    }
    recordPayment(id, recordPaymentDto, req) {
        return this.ordersService.recordPayment(id, recordPaymentDto, req.user);
    }
};
exports.OrdersController = OrdersController;
__decorate([
    (0, common_1.Post)('by-salesrep'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMMERCIAL),
    (0, common_1.UseInterceptors)(order_design_upload_interceptor_1.OrderDesignUploadInterceptor),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFiles)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_order_dto_1.CreateOrderBySalesRepDto, Object, Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "createBySalesRep", null);
__decorate([
    (0, common_1.Post)('by-salesrep/json'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMMERCIAL),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_order_dto_1.CreateOrderBySalesRepDto, Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "createBySalesRepJson", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.PRODUCTION_DIRECTOR, client_1.UserRole.FINANCIAL_DIRECTOR, client_1.UserRole.CAISSIER),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [find_all_orders_dto_1.FindAllOrdersDto, Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('pending-validation'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.PRODUCTION_DIRECTOR, client_1.UserRole.SUPER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Query)('subsidiaryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pagination_query_dto_1.PaginationQueryDto, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "findPendingValidation", null);
__decorate([
    (0, common_1.Patch)('validate-production/:id'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.PRODUCTION_DIRECTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "validateForProduction", null);
__decorate([
    (0, common_1.Patch)('reject-order/:id'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.PRODUCTION_DIRECTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "rejectOrder", null);
__decorate([
    (0, common_1.Get)('analytics/top-selling'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.PRODUCTION_DIRECTOR, client_1.UserRole.FINANCIAL_DIRECTOR, client_1.UserRole.CAISSIER),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [find_all_orders_dto_1.FindAllOrdersDto, Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "findTopSellingProducts", null);
__decorate([
    (0, common_1.Get)('payment-accounts'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.CAISSIER),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "findPaymentAccounts", null);
__decorate([
    (0, common_1.Get)('staff/:id'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.PRODUCTION_DIRECTOR, client_1.UserRole.FINANCIAL_DIRECTOR, client_1.UserRole.CAISSIER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "findStaffOrder", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(contact_jwt_guard_1.ContactJwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('customer/:customerId'),
    (0, common_1.UseGuards)(contact_jwt_guard_1.ContactJwtAuthGuard),
    __param(0, (0, common_1.Param)('customerId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "findByCustomer", null);
__decorate([
    (0, common_1.Patch)('/order-status/:id'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.PRODUCTION_DIRECTOR, client_1.UserRole.CAISSIER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_order_dto_1.UpdateOrderStatusDto, Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "updateOrderStatus", null);
__decorate([
    (0, common_1.Patch)('/production-status/:id'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.PRODUCTION_DIRECTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_order_dto_1.updateProductionStatusDto, Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "updateProductionStatus", null);
__decorate([
    (0, common_1.Patch)('/payment/:id'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.CAISSIER),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_order_dto_1.RecordPaymentDto, Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "recordPayment", null);
exports.OrdersController = OrdersController = __decorate([
    (0, common_1.Controller)('ecommerce/orders'),
    __metadata("design:paramtypes", [orders_service_1.OrdersService])
], OrdersController);
//# sourceMappingURL=orders.controller.js.map