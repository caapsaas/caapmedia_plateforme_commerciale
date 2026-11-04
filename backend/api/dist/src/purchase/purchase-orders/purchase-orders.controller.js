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
exports.PurchaseOrdersController = void 0;
const common_1 = require("@nestjs/common");
const purchase_orders_service_1 = require("./purchase-orders.service");
const create_purchase_order_dto_1 = require("./dto/create-purchase-order.dto");
const jwt_guard_1 = require("../../common/auth/jwt/jwt.guard");
const role_guard_1 = require("../../common/auth/role/role.guard");
const role_decorator_1 = require("../../common/auth/role/role.decorator");
const client_1 = require("@prisma/client");
const find_all_purchase_orders_dto_1 = require("./dto/find-all-purchase-orders.dto");
const receive_items_dto_1 = require("./dto/receive-items.dto");
let PurchaseOrdersController = class PurchaseOrdersController {
    purchaseOrdersService;
    constructor(purchaseOrdersService) {
        this.purchaseOrdersService = purchaseOrdersService;
    }
    create(createPurchaseOrderDto, req) {
        return this.purchaseOrdersService.create(createPurchaseOrderDto, req.user);
    }
    findAll(req, query) {
        return this.purchaseOrdersService.findAll(req.user, query);
    }
    findOne(id, req) {
        return this.purchaseOrdersService.findOne(id, req.user);
    }
    updateStatus(id, updateStatusDto, req) {
        return this.purchaseOrdersService.updateStatus(id, updateStatusDto, req.user);
    }
    receiveItems(id, receiveItemsDto, req) {
        return this.purchaseOrdersService.receiveItems(id, receiveItemsDto, req.user);
    }
};
exports.PurchaseOrdersController = PurchaseOrdersController;
__decorate([
    (0, common_1.Post)(),
    (0, role_decorator_1.Roles)(client_1.UserRole.PURCHASING_MANAGER, client_1.UserRole.ADMIN, client_1.UserRole.FINANCIAL_DIRECTOR),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_purchase_order_dto_1.CreatePurchaseOrderDto, Object]),
    __metadata("design:returntype", void 0)
], PurchaseOrdersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, role_decorator_1.Roles)(client_1.UserRole.PURCHASING_MANAGER, client_1.UserRole.ADMIN, client_1.UserRole.FINANCIAL_DIRECTOR, client_1.UserRole.SUPER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, find_all_purchase_orders_dto_1.FindAllPurchaseOrdersDto]),
    __metadata("design:returntype", void 0)
], PurchaseOrdersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, role_decorator_1.Roles)(client_1.UserRole.PURCHASING_MANAGER, client_1.UserRole.ADMIN, client_1.UserRole.FINANCIAL_DIRECTOR),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PurchaseOrdersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, role_decorator_1.Roles)(client_1.UserRole.PURCHASING_MANAGER, client_1.UserRole.ADMIN, client_1.UserRole.FINANCIAL_DIRECTOR),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_purchase_order_dto_1.UpdatePurchaseOrderStatusDto, Object]),
    __metadata("design:returntype", void 0)
], PurchaseOrdersController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)(':id/receive'),
    (0, role_decorator_1.Roles)(client_1.UserRole.PURCHASING_MANAGER, client_1.UserRole.ADMIN, client_1.UserRole.FINANCIAL_DIRECTOR),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, receive_items_dto_1.ReceiveItemsDto, Object]),
    __metadata("design:returntype", void 0)
], PurchaseOrdersController.prototype, "receiveItems", null);
exports.PurchaseOrdersController = PurchaseOrdersController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, common_1.Controller)('purchasing/purchase-orders'),
    __metadata("design:paramtypes", [purchase_orders_service_1.PurchaseOrdersService])
], PurchaseOrdersController);
//# sourceMappingURL=purchase-orders.controller.js.map