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
exports.FindAllSalesDto = exports.OrderPeriod = void 0;
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
const pagination_query_dto_1 = require("../../../common/pagination/dto/pagination-query.dto");
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
class FindAllSalesDto extends pagination_query_dto_1.PaginationQueryDto {
    customerId;
    salesRepId;
    paymentMethod;
    period;
    startDate;
    endDate;
}
exports.FindAllSalesDto = FindAllSalesDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FindAllSalesDto.prototype, "customerId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FindAllSalesDto.prototype, "salesRepId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.CustomerPaymentMethod),
    __metadata("design:type", String)
], FindAllSalesDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(OrderPeriod),
    __metadata("design:type", String)
], FindAllSalesDto.prototype, "period", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FindAllSalesDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FindAllSalesDto.prototype, "endDate", void 0);
//# sourceMappingURL=find-all-sales.dto.js.map