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
exports.updateProductionStatusDto = exports.UpdateOrderStatusDto = exports.RecordPaymentDto = exports.CreateOrderBySalesRepDto = exports.OccasionalOrderCustomerDto = exports.CreateProductionSummaryDto = exports.CreateProductionStepDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
const client_2 = require("@prisma/client");
const client_3 = require("@prisma/client");
class CreateProductOptionDto {
    optionType;
    optionValue;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateProductOptionDto.prototype, "optionType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateProductOptionDto.prototype, "optionValue", void 0);
class CreateProductionStepDto {
    equipmentId;
    equipmentNameSnapshot;
    stepOrder;
    estimatedTimeHours;
    hourlyRateSnapshot;
    calculatedCost;
}
exports.CreateProductionStepDto = CreateProductionStepDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateProductionStepDto.prototype, "equipmentId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateProductionStepDto.prototype, "equipmentNameSnapshot", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateProductionStepDto.prototype, "stepOrder", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], CreateProductionStepDto.prototype, "estimatedTimeHours", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateProductionStepDto.prototype, "hourlyRateSnapshot", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateProductionStepDto.prototype, "calculatedCost", void 0);
class CreateProductionSummaryDto {
    totalProductionCost;
    marginPercent;
    finalPrice;
}
exports.CreateProductionSummaryDto = CreateProductionSummaryDto;
__decorate([
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateProductionSummaryDto.prototype, "totalProductionCost", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    __metadata("design:type", Number)
], CreateProductionSummaryDto.prototype, "marginPercent", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateProductionSummaryDto.prototype, "finalPrice", void 0);
class CreateOrderItemDto {
    productId;
    quantity;
    unitPrice;
    discount;
    assemblyPrice;
    designFileName;
    designFileUrl;
    options;
    specValues;
    productionSteps;
    productionSummary;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateOrderItemDto.prototype, "productId", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateOrderItemDto.prototype, "quantity", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateOrderItemDto.prototype, "unitPrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateOrderItemDto.prototype, "discount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateOrderItemDto.prototype, "assemblyPrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrderItemDto.prototype, "designFileName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrderItemDto.prototype, "designFileUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateProductOptionDto),
    __metadata("design:type", Array)
], CreateOrderItemDto.prototype, "options", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateOrderItemDto.prototype, "specValues", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateProductionStepDto),
    __metadata("design:type", Array)
], CreateOrderItemDto.prototype, "productionSteps", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => CreateProductionSummaryDto),
    __metadata("design:type", CreateProductionSummaryDto)
], CreateOrderItemDto.prototype, "productionSummary", void 0);
class OccasionalOrderCustomerDto {
    name;
    phone;
    email;
}
exports.OccasionalOrderCustomerDto = OccasionalOrderCustomerDto;
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.trim() : value),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 255),
    __metadata("design:type", String)
], OccasionalOrderCustomerDto.prototype, "name", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.trim() : value),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(7, 30),
    (0, class_validator_1.Matches)(/^\+?[0-9 ()-]+$/),
    __metadata("design:type", String)
], OccasionalOrderCustomerDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() || undefined : value),
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.Length)(1, 255),
    __metadata("design:type", String)
], OccasionalOrderCustomerDto.prototype, "email", void 0);
class CreateOrderBySalesRepDto {
    customerId;
    occasionalCustomer;
    customerName;
    paymentDueDate;
    paymentMethod;
    opportunityId;
    source;
    items;
    applyTax;
}
exports.CreateOrderBySalesRepDto = CreateOrderBySalesRepDto;
__decorate([
    (0, class_validator_1.ValidateIf)((dto) => !dto.occasionalCustomer || dto.customerId !== undefined),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateOrderBySalesRepDto.prototype, "customerId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (typeof value !== 'string')
            return value;
        try {
            return (0, class_transformer_1.plainToInstance)(OccasionalOrderCustomerDto, JSON.parse(value));
        }
        catch {
            return value;
        }
    }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => OccasionalOrderCustomerDto),
    __metadata("design:type", OccasionalOrderCustomerDto)
], CreateOrderBySalesRepDto.prototype, "occasionalCustomer", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((dto) => !dto.occasionalCustomer),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateOrderBySalesRepDto.prototype, "customerName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateOrderBySalesRepDto.prototype, "paymentDueDate", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEnum)(client_2.CustomerPaymentMethod),
    __metadata("design:type", String)
], CreateOrderBySalesRepDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrderBySalesRepDto.prototype, "opportunityId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEnum)(client_1.OrderSource),
    __metadata("design:type", String)
], CreateOrderBySalesRepDto.prototype, "source", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateOrderItemDto),
    __metadata("design:type", Array)
], CreateOrderBySalesRepDto.prototype, "items", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_transformer_1.Type)(() => Boolean),
    __metadata("design:type", Boolean)
], CreateOrderBySalesRepDto.prototype, "applyTax", void 0);
class RecordPaymentDto {
    amount;
    paymentMethod;
    bankAccountId;
    transactionReference;
}
exports.RecordPaymentDto = RecordPaymentDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], RecordPaymentDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEnum)(client_2.CustomerPaymentMethod),
    __metadata("design:type", String)
], RecordPaymentDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecordPaymentDto.prototype, "bankAccountId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecordPaymentDto.prototype, "transactionReference", void 0);
class UpdateOrderStatusDto {
    status;
}
exports.UpdateOrderStatusDto = UpdateOrderStatusDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_2.OrderStatus),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateOrderStatusDto.prototype, "status", void 0);
class updateProductionStatusDto {
    productionStatus;
}
exports.updateProductionStatusDto = updateProductionStatusDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_3.ProductionStatus),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], updateProductionStatusDto.prototype, "productionStatus", void 0);
//# sourceMappingURL=create-order.dto.js.map