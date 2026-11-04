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
exports.FindStockMovementsDto = exports.WithdrawForOrderDto = exports.InventoryAdjustmentDto = exports.CreateStockMovementDto = exports.MANUAL_MOVEMENT_TYPES = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
const pagination_query_dto_1 = require("../../../common/pagination/dto/pagination-query.dto");
exports.MANUAL_MOVEMENT_TYPES = [
    client_1.StockMovementType.CUSTOMER_RETURN,
    client_1.StockMovementType.TRANSFER_IN,
    client_1.StockMovementType.TRANSFER_OUT,
    client_1.StockMovementType.LOSS,
    client_1.StockMovementType.BREAKAGE,
    client_1.StockMovementType.INTERNAL_CONSUMPTION,
    client_1.StockMovementType.SUPPLIER_RETURN,
];
class CreateStockMovementDto {
    itemId;
    type;
    quantity;
    reason;
}
exports.CreateStockMovementDto = CreateStockMovementDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateStockMovementDto.prototype, "itemId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(exports.MANUAL_MOVEMENT_TYPES),
    __metadata("design:type", String)
], CreateStockMovementDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateStockMovementDto.prototype, "quantity", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateStockMovementDto.prototype, "reason", void 0);
class InventoryAdjustmentDto {
    itemId;
    countedStock;
    reason;
    subsidiaryId;
}
exports.InventoryAdjustmentDto = InventoryAdjustmentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], InventoryAdjustmentDto.prototype, "itemId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], InventoryAdjustmentDto.prototype, "countedStock", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], InventoryAdjustmentDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InventoryAdjustmentDto.prototype, "subsidiaryId", void 0);
class WithdrawItemDto {
    itemId;
    quantity;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], WithdrawItemDto.prototype, "itemId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], WithdrawItemDto.prototype, "quantity", void 0);
class WithdrawForOrderDto {
    orderId;
    items;
}
exports.WithdrawForOrderDto = WithdrawForOrderDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], WithdrawForOrderDto.prototype, "orderId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => WithdrawItemDto),
    __metadata("design:type", Array)
], WithdrawForOrderDto.prototype, "items", void 0);
class FindStockMovementsDto extends pagination_query_dto_1.PaginationQueryDto {
    subsidiaryId;
    itemId;
    type;
    startDate;
    endDate;
}
exports.FindStockMovementsDto = FindStockMovementsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FindStockMovementsDto.prototype, "subsidiaryId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FindStockMovementsDto.prototype, "itemId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.StockMovementType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FindStockMovementsDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FindStockMovementsDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FindStockMovementsDto.prototype, "endDate", void 0);
//# sourceMappingURL=stock-movement.dto.js.map