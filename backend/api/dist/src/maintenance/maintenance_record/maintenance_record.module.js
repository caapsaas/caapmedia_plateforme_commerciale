"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaintenanceRecordModule = void 0;
const common_1 = require("@nestjs/common");
const maintenance_record_controller_1 = require("./maintenance_record.controller");
const maintenance_record_service_1 = require("./maintenance_record.service");
let MaintenanceRecordModule = class MaintenanceRecordModule {
};
exports.MaintenanceRecordModule = MaintenanceRecordModule;
exports.MaintenanceRecordModule = MaintenanceRecordModule = __decorate([
    (0, common_1.Module)({
        controllers: [maintenance_record_controller_1.MaintenanceRecordController],
        providers: [maintenance_record_service_1.MaintenanceRecordService],
    })
], MaintenanceRecordModule);
//# sourceMappingURL=maintenance_record.module.js.map