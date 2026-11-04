"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EquipmentCostConfigModule = void 0;
const common_1 = require("@nestjs/common");
const equipment_cost_config_service_1 = require("./equipment-cost-config.service");
const equipment_cost_config_controller_1 = require("./equipment-cost-config.controller");
let EquipmentCostConfigModule = class EquipmentCostConfigModule {
};
exports.EquipmentCostConfigModule = EquipmentCostConfigModule;
exports.EquipmentCostConfigModule = EquipmentCostConfigModule = __decorate([
    (0, common_1.Module)({
        providers: [equipment_cost_config_service_1.EquipmentCostConfigService],
        controllers: [equipment_cost_config_controller_1.EquipmentCostConfigController],
        exports: [equipment_cost_config_service_1.EquipmentCostConfigService],
    })
], EquipmentCostConfigModule);
//# sourceMappingURL=equipment-cost-config.module.js.map