"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendancerecordModule = void 0;
const common_1 = require("@nestjs/common");
const attendancerecord_service_1 = require("./attendancerecord.service");
const attendancerecord_controller_1 = require("./attendancerecord.controller");
const dynamic_token_service_1 = require("./services/dynamic-token.service");
const pointage_controller_1 = require("./controllers/pointage.controller");
const dynamic_token_controller_1 = require("./controllers/dynamic-token.controller");
const attendance_security_service_1 = require("./services/attendance-security.service");
let AttendancerecordModule = class AttendancerecordModule {
};
exports.AttendancerecordModule = AttendancerecordModule;
exports.AttendancerecordModule = AttendancerecordModule = __decorate([
    (0, common_1.Module)({
        controllers: [
            attendancerecord_controller_1.AttendanceRecordController,
            pointage_controller_1.PointageController,
            dynamic_token_controller_1.DynamicTokenController,
        ],
        providers: [
            attendancerecord_service_1.AttendanceRecordService,
            dynamic_token_service_1.DynamicTokenService,
            attendance_security_service_1.AttendanceSecurityService,
        ],
        exports: [attendancerecord_service_1.AttendanceRecordService, dynamic_token_service_1.DynamicTokenService],
    })
], AttendancerecordModule);
//# sourceMappingURL=attendancerecord.module.js.map