"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionModule = void 0;
const common_1 = require("@nestjs/common");
const equipment_cost_config_module_1 = require("./equipment-cost-config/equipment-cost-config.module");
const commercial_params_module_1 = require("./commercial-params/commercial-params.module");
const production_workflows_module_1 = require("./production-workflows/production-workflows.module");
let ProductionModule = class ProductionModule {
};
exports.ProductionModule = ProductionModule;
exports.ProductionModule = ProductionModule = __decorate([
    (0, common_1.Module)({
        imports: [
            equipment_cost_config_module_1.EquipmentCostConfigModule,
            commercial_params_module_1.CommercialParamsModule,
            production_workflows_module_1.ProductionWorkflowsModule,
        ],
    })
], ProductionModule);
//# sourceMappingURL=production.module.js.map