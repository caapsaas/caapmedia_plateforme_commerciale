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
exports.StockMovementsController = void 0;
const common_1 = require("@nestjs/common");
const stock_movements_service_1 = require("./stock-movements.service");
const jwt_guard_1 = require("../../common/auth/jwt/jwt.guard");
const role_guard_1 = require("../../common/auth/role/role.guard");
const role_decorator_1 = require("../../common/auth/role/role.decorator");
const client_1 = require("@prisma/client");
const stock_movement_dto_1 = require("./dto/stock-movement.dto");
const READ_ROLES = [
    client_1.UserRole.ADMIN,
    client_1.UserRole.SUPER_ADMIN,
    client_1.UserRole.PURCHASING_MANAGER,
    client_1.UserRole.PRODUCTION_DIRECTOR,
    client_1.UserRole.FINANCIAL_DIRECTOR,
];
const MANAGE_ROLES = [
    client_1.UserRole.ADMIN,
    client_1.UserRole.SUPER_ADMIN,
    client_1.UserRole.PURCHASING_MANAGER,
];
const WITHDRAW_ROLES = [
    client_1.UserRole.ADMIN,
    client_1.UserRole.SUPER_ADMIN,
    client_1.UserRole.PRODUCTION_DIRECTOR,
];
let StockMovementsController = class StockMovementsController {
    stockMovementsService;
    constructor(stockMovementsService) {
        this.stockMovementsService = stockMovementsService;
    }
    findAll(query, req) {
        return this.stockMovementsService.findAll(req.user, query);
    }
    create(dto, req) {
        return this.stockMovementsService.createManual(dto, req.user);
    }
    adjustInventory(dto, req) {
        return this.stockMovementsService.adjustInventory(dto, req.user);
    }
    withdrawForOrder(dto, req) {
        return this.stockMovementsService.withdrawForOrder(dto, req.user);
    }
};
exports.StockMovementsController = StockMovementsController;
__decorate([
    (0, common_1.Get)(),
    (0, role_decorator_1.Roles)(...READ_ROLES),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [stock_movement_dto_1.FindStockMovementsDto, Object]),
    __metadata("design:returntype", void 0)
], StockMovementsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, role_decorator_1.Roles)(...MANAGE_ROLES),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [stock_movement_dto_1.CreateStockMovementDto, Object]),
    __metadata("design:returntype", void 0)
], StockMovementsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('inventory-adjustment'),
    (0, role_decorator_1.Roles)(...MANAGE_ROLES),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [stock_movement_dto_1.InventoryAdjustmentDto, Object]),
    __metadata("design:returntype", void 0)
], StockMovementsController.prototype, "adjustInventory", null);
__decorate([
    (0, common_1.Post)('withdraw-for-order'),
    (0, role_decorator_1.Roles)(...WITHDRAW_ROLES),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [stock_movement_dto_1.WithdrawForOrderDto, Object]),
    __metadata("design:returntype", void 0)
], StockMovementsController.prototype, "withdrawForOrder", null);
exports.StockMovementsController = StockMovementsController = __decorate([
    (0, common_1.Controller)('purchase/stock-movements'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    __metadata("design:paramtypes", [stock_movements_service_1.StockMovementsService])
], StockMovementsController);
//# sourceMappingURL=stock-movements.controller.js.map