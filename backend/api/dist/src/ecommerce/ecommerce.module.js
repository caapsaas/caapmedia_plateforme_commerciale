"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EcommerceModule = void 0;
const common_1 = require("@nestjs/common");
const products_module_1 = require("./products/products.module");
const product_specs_module_1 = require("./products/product-specs/product-specs.module");
const spec_reference_lists_module_1 = require("./products/spec-reference-lists/spec-reference-lists.module");
const orders_module_1 = require("./orders/orders.module");
const taxes_module_1 = require("./taxes/taxes.module");
const sales_module_1 = require("./sales/sales.module");
const production_module_1 = require("./production/production.module");
let EcommerceModule = class EcommerceModule {
};
exports.EcommerceModule = EcommerceModule;
exports.EcommerceModule = EcommerceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            products_module_1.ProductsModule,
            product_specs_module_1.ProductSpecsModule,
            spec_reference_lists_module_1.SpecReferenceListsModule,
            orders_module_1.OrdersModule,
            taxes_module_1.TaxesModule,
            sales_module_1.SalesModule,
            production_module_1.ProductionModule,
        ],
    })
], EcommerceModule);
//# sourceMappingURL=ecommerce.module.js.map