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
exports.StockItemsController = void 0;
const common_1 = require("@nestjs/common");
const stock_items_service_1 = require("./stock-items.service");
const jwt_guard_1 = require("../../common/auth/jwt/jwt.guard");
const role_guard_1 = require("../../common/auth/role/role.guard");
const role_decorator_1 = require("../../common/auth/role/role.decorator");
const client_1 = require("@prisma/client");
const create_stock_item_dto_1 = require("./dto/create-stock-item.dto");
const pagination_query_dto_1 = require("../../common/pagination/dto/pagination-query.dto");
let StockItemsController = class StockItemsController {
    stockItemsService;
    constructor(stockItemsService) {
        this.stockItemsService = stockItemsService;
    }
    create(createStockItemDto, req) {
        return this.stockItemsService.create(createStockItemDto, req.user);
    }
    findAll(req, paginationQuery, subsidiaryId) {
        return this.stockItemsService.findAll(req.user, paginationQuery, subsidiaryId);
    }
    findOne(id, req) {
        return this.stockItemsService.findOne(id, req.user);
    }
    update(id, updateStockItemDto, req) {
        return this.stockItemsService.update(id, updateStockItemDto, req.user);
    }
    remove(id, req) {
        return this.stockItemsService.remove(id, req.user);
    }
    listPackagingUnits(id, req) {
        return this.stockItemsService.listPackagingUnits(id, req.user);
    }
    addPackagingUnit(id, dto, req) {
        return this.stockItemsService.addPackagingUnit(id, dto, req.user);
    }
    updatePackagingUnit(packagingUnitId, dto) {
        return this.stockItemsService.updatePackagingUnit(packagingUnitId, dto);
    }
    removePackagingUnit(packagingUnitId) {
        return this.stockItemsService.removePackagingUnit(packagingUnitId);
    }
};
exports.StockItemsController = StockItemsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_stock_item_dto_1.CreateStockItemDto, Object]),
    __metadata("design:returntype", void 0)
], StockItemsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Query)('subsidiaryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pagination_query_dto_1.PaginationQueryDto, String]),
    __metadata("design:returntype", void 0)
], StockItemsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StockItemsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_stock_item_dto_1.UpdateStockItemDto, Object]),
    __metadata("design:returntype", void 0)
], StockItemsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StockItemsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/packaging-units'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], StockItemsController.prototype, "listPackagingUnits", null);
__decorate([
    (0, common_1.Post)(':id/packaging-units'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_stock_item_dto_1.CreatePackagingUnitDto, Object]),
    __metadata("design:returntype", void 0)
], StockItemsController.prototype, "addPackagingUnit", null);
__decorate([
    (0, common_1.Patch)('packaging-units/:packagingUnitId'),
    __param(0, (0, common_1.Param)('packagingUnitId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_stock_item_dto_1.UpdatePackagingUnitDto]),
    __metadata("design:returntype", void 0)
], StockItemsController.prototype, "updatePackagingUnit", null);
__decorate([
    (0, common_1.Delete)('packaging-units/:packagingUnitId'),
    __param(0, (0, common_1.Param)('packagingUnitId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StockItemsController.prototype, "removePackagingUnit", null);
exports.StockItemsController = StockItemsController = __decorate([
    (0, common_1.Controller)('purchase/stock-items'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.CAISSIER, client_1.UserRole.PURCHASING_MANAGER, client_1.UserRole.PRODUCTION_DIRECTOR, client_1.UserRole.FINANCIAL_DIRECTOR),
    __metadata("design:paramtypes", [stock_items_service_1.StockItemsService])
], StockItemsController);
//# sourceMappingURL=stock-items.controller.js.map