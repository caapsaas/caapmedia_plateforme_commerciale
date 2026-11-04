"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommercialParamsModule = void 0;
const common_1 = require("@nestjs/common");
const commercial_params_service_1 = require("./commercial-params.service");
const commercial_params_controller_1 = require("./commercial-params.controller");
let CommercialParamsModule = class CommercialParamsModule {
};
exports.CommercialParamsModule = CommercialParamsModule;
exports.CommercialParamsModule = CommercialParamsModule = __decorate([
    (0, common_1.Module)({
        providers: [commercial_params_service_1.CommercialParamsService],
        controllers: [commercial_params_controller_1.CommercialParamsController],
        exports: [commercial_params_service_1.CommercialParamsService],
    })
], CommercialParamsModule);
//# sourceMappingURL=commercial-params.module.js.map