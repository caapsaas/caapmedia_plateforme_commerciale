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
exports.CommercialParamsController = void 0;
const common_1 = require("@nestjs/common");
const commercial_params_service_1 = require("./commercial-params.service");
const upsert_commercial_params_dto_1 = require("./dto/upsert-commercial-params.dto");
const jwt_guard_1 = require("../../../common/auth/jwt/jwt.guard");
const role_guard_1 = require("../../../common/auth/role/role.guard");
const role_decorator_1 = require("../../../common/auth/role/role.decorator");
const client_1 = require("@prisma/client");
let CommercialParamsController = class CommercialParamsController {
    service;
    constructor(service) {
        this.service = service;
    }
    findGlobal() {
        return this.service.findGlobal();
    }
    upsert(dto, user) {
        return this.service.upsert(dto, user);
    }
};
exports.CommercialParamsController = CommercialParamsController;
__decorate([
    (0, common_1.Get)(),
    (0, role_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.FINANCIAL_DIRECTOR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CommercialParamsController.prototype, "findGlobal", null);
__decorate([
    (0, common_1.Put)(),
    (0, role_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, role_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [upsert_commercial_params_dto_1.UpsertCommercialParamsDto, Object]),
    __metadata("design:returntype", void 0)
], CommercialParamsController.prototype, "upsert", null);
exports.CommercialParamsController = CommercialParamsController = __decorate([
    (0, common_1.Controller)('production/commercial-params'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    __metadata("design:paramtypes", [commercial_params_service_1.CommercialParamsService])
], CommercialParamsController);
//# sourceMappingURL=commercial-params.controller.js.map