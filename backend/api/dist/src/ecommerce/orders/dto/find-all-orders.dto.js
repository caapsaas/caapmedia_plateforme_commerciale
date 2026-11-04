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
exports.FindAllOrdersDto = exports.OrderPeriod = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
var OrderPeriod;
(function (OrderPeriod) {
    OrderPeriod["ALL_TIME"] = "all_time";
    OrderPeriod["THIS_MONTH"] = "this_month";
    OrderPeriod["LAST_MONTH"] = "last_month";
    OrderPeriod["LAST_7_DAYS"] = "last_7_days";
    OrderPeriod["LAST_30_DAYS"] = "last_30_days";
    OrderPeriod["LAST_90_DAYS"] = "last_90_days";
    OrderPeriod["THIS_YEAR"] = "this_year";
    OrderPeriod["CUSTOM"] = "custom";
})(OrderPeriod || (exports.OrderPeriod = OrderPeriod = {}));
class FindAllOrdersDto {
    customerId;
    productId;
    subsidiaryId;
    salesRepId;
    orderStatus;
    paymentStatus;
    period;
    startDate;
    endDate;
}
exports.FindAllOrdersDto = FindAllOrdersDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim() || undefined),
    __metadata("design:type", String)
], FindAllOrdersDto.prototype, "customerId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim() || undefined),
    __metadata("design:type", String)
], FindAllOrdersDto.prototype, "productId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim() || undefined),
    __metadata("design:type", String)
], FindAllOrdersDto.prototype, "subsidiaryId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(({ value }) => value?.trim() || undefined),
    __metadata("design:type", String)
], FindAllOrdersDto.prototype, "salesRepId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.OrderStatus),
    __metadata("design:type", String)
], FindAllOrdersDto.prototype, "orderStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.PaymentStatus),
    __metadata("design:type", String)
], FindAllOrdersDto.prototype, "paymentStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(OrderPeriod),
    __metadata("design:type", String)
], FindAllOrdersDto.prototype, "period", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], FindAllOrdersDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], FindAllOrdersDto.prototype, "endDate", void 0);
//# sourceMappingURL=find-all-orders.dto.js.map