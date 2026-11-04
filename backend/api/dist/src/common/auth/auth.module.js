"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth/auth.service");
const passport_1 = require("@nestjs/passport");
const jwt_1 = require("@nestjs/jwt");
const jwt_strategy_1 = require("./strategies/jwt.strategy");
const utils_module_1 = require("../utils/utils.module");
const role_guard_1 = require("./role/role.guard");
const subsidiary_guard_1 = require("./subsidiary/subsidiary.guard");
const auth_controller_1 = require("./auth/auth.controller");
const refresh_token_service_1 = require("./auth/refresh-token.service");
const auth_audit_service_1 = require("./auth/auth-audit.service");
const two_factor_controller_1 = require("./two-factor/two-factor.controller");
const two_factor_service_1 = require("./two-factor/two-factor.service");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            utils_module_1.UtilsModule,
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET,
                signOptions: { expiresIn: '15m' },
            }),
        ],
        controllers: [auth_controller_1.AuthController, two_factor_controller_1.TwoFactorController],
        providers: [
            auth_service_1.AuthService,
            jwt_strategy_1.JwtStrategy,
            role_guard_1.RoleGuard,
            subsidiary_guard_1.SubsidiaryGuard,
            refresh_token_service_1.RefreshTokenService,
            auth_audit_service_1.AuthAuditService,
            two_factor_service_1.TwoFactorService,
        ],
        exports: [
            auth_service_1.AuthService,
            jwt_1.JwtModule,
            role_guard_1.RoleGuard,
            subsidiary_guard_1.SubsidiaryGuard,
            refresh_token_service_1.RefreshTokenService,
            auth_audit_service_1.AuthAuditService,
            two_factor_service_1.TwoFactorService,
        ],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map