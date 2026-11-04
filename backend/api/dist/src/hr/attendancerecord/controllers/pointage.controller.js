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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PointageController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const secure_pointage_dto_1 = require("../dto/secure-pointage.dto");
const attendance_security_service_1 = require("../services/attendance-security.service");
let PointageController = class PointageController {
    security;
    constructor(security) {
        this.security = security;
    }
    employees() {
        throw new common_1.GoneException('La liste publique des employés est désactivée.');
    }
    pointage(dto) {
        return this.security.pointage(dto);
    }
};
exports.PointageController = PointageController;
__decorate([
    (0, common_1.Get)('employees'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PointageController.prototype, "employees", null);
__decorate([
    (0, common_1.Post)(),
    (0, throttler_1.Throttle)({ default: { limit: 20, ttl: 60000 } }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [secure_pointage_dto_1.SecurePointageDto]),
    __metadata("design:returntype", void 0)
], PointageController.prototype, "pointage", null);
exports.PointageController = PointageController = __decorate([
    (0, common_1.Controller)('pointage'),
    __metadata("design:paramtypes", [attendance_security_service_1.AttendanceSecurityService])
], PointageController);
//# sourceMappingURL=pointage.controller.js.map