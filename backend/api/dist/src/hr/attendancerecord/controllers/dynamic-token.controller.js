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
exports.DynamicTokenController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const jwt_guard_1 = require("../../../common/auth/jwt/jwt.guard");
const role_guard_1 = require("../../../common/auth/role/role.guard");
const role_decorator_1 = require("../../../common/auth/role/role.decorator");
const subsidiary_scope_1 = require("../../../common/utils/subsidiary-scope");
const dynamic_token_service_1 = require("../services/dynamic-token.service");
let DynamicTokenController = class DynamicTokenController {
    dynamicTokenService;
    constructor(dynamicTokenService) {
        this.dynamicTokenService = dynamicTokenService;
    }
    async getCurrentToken(user, requestedId) {
        const result = await this.dynamicTokenService.getPermanentToken(this.resolveSubsidiary(user, requestedId));
        return this.response(result);
    }
    async generateNewToken(user, requestedId) {
        const result = await this.dynamicTokenService.getPermanentToken(this.resolveSubsidiary(user, requestedId), true);
        return this.response(result);
    }
    response(result) {
        return {
            ...result,
            qrUrl: `${(process.env.FRONTEND_URL || 'https://caapmedia.com').replace(/\/+$/, '')}/pointage?t=${result.token}`,
        };
    }
    resolveSubsidiary(user, requestedId) {
        const ctx = (0, subsidiary_scope_1.resolveScopeContext)(user);
        if (requestedId && !ctx.hasGlobalScope && requestedId !== ctx.subsidiaryId)
            throw new common_1.ForbiddenException('Accès limité à votre filiale.');
        return requestedId || ctx.subsidiaryId;
    }
};
exports.DynamicTokenController = DynamicTokenController;
__decorate([
    (0, common_1.Get)('current'),
    __param(0, (0, role_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('subsidiaryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DynamicTokenController.prototype, "getCurrentToken", null);
__decorate([
    (0, common_1.Post)('generate'),
    __param(0, (0, role_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('subsidiaryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DynamicTokenController.prototype, "generateNewToken", null);
exports.DynamicTokenController = DynamicTokenController = __decorate([
    (0, common_1.Controller)('hr/dynamic-token'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.HR_MANAGER, client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN),
    __metadata("design:paramtypes", [dynamic_token_service_1.DynamicTokenService])
], DynamicTokenController);
//# sourceMappingURL=dynamic-token.controller.js.map