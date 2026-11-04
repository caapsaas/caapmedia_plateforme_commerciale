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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const auth_service_1 = require("./auth.service");
const auth_audit_service_1 = require("./auth-audit.service");
const jwt_guard_1 = require("../jwt/jwt.guard");
const role_guard_1 = require("../role/role.guard");
const role_decorator_1 = require("../role/role.decorator");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
const class_transformer_1 = require("class-transformer");
const cookie_util_1 = require("../cookie.util");
const pagination_query_dto_1 = require("../../pagination/dto/pagination-query.dto");
class RegisterDto {
    userName;
    email;
    password;
    userRole;
    additionalRoles;
    subsidiaryId;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "userName", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.UserRole),
    __metadata("design:type", String)
], RegisterDto.prototype, "userRole", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(client_1.UserRole, { each: true }),
    __metadata("design:type", Array)
], RegisterDto.prototype, "additionalRoles", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "subsidiaryId", void 0);
class LoginDto {
    email;
    password;
}
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], LoginDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
class ForgotPasswordDto {
    email;
}
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], ForgotPasswordDto.prototype, "email", void 0);
class ResetPasswordDto {
    token;
    password;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "token", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(10),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "password", void 0);
class SwitchRoleDto {
    role;
}
__decorate([
    (0, class_validator_1.IsEnum)(client_1.UserRole),
    __metadata("design:type", String)
], SwitchRoleDto.prototype, "role", void 0);
class UpdateUserDto {
    userName;
    email;
    password;
    userRole;
    additionalRoles;
    subsidiaryId;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "userName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.UserRole),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "userRole", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(client_1.UserRole, { each: true }),
    __metadata("design:type", Array)
], UpdateUserDto.prototype, "additionalRoles", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "subsidiaryId", void 0);
class GetUsersQueryDto extends pagination_query_dto_1.PaginationQueryDto {
    subsidiaryId;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetUsersQueryDto.prototype, "subsidiaryId", void 0);
class SearchUsersDto extends pagination_query_dto_1.PaginationQueryDto {
    email;
    userName;
    userRole;
    subsidiaryId;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], SearchUsersDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchUsersDto.prototype, "userName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.UserRole),
    __metadata("design:type", String)
], SearchUsersDto.prototype, "userRole", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchUsersDto.prototype, "subsidiaryId", void 0);
class AuditLogQueryDto {
    userId;
    email;
    event;
    take;
    skip;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuditLogQueryDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AuditLogQueryDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.AuthAuditEvent),
    __metadata("design:type", String)
], AuditLogQueryDto.prototype, "event", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], AuditLogQueryDto.prototype, "take", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], AuditLogQueryDto.prototype, "skip", void 0);
let AuthController = class AuthController {
    authService;
    authAuditService;
    constructor(authService, authAuditService) {
        this.authService = authService;
        this.authAuditService = authAuditService;
    }
    async register(dto, req) {
        return this.authService.register(dto.userName, dto.email, dto.password, dto.userRole, dto.subsidiaryId, dto.additionalRoles ?? [], req.user);
    }
    async login(dto, req, res) {
        const meta = {
            email: dto.email,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        };
        let result;
        try {
            result = await this.authService.login(dto.email, dto.password);
        }
        catch (error) {
            await this.authAuditService.log('LOGIN_FAILED', meta);
            throw error;
        }
        if (result.twoFactorRequired) {
            await this.authAuditService.log('LOGIN_2FA_PENDING', {
                ...meta,
                userId: undefined,
            });
            return { twoFactorRequired: true, pendingToken: result.pendingToken };
        }
        const { accessToken, refreshToken, user: userPayload, } = await this.authService.issueTokens(result.user, {
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip,
        });
        (0, cookie_util_1.setAuthCookies)(res, accessToken, refreshToken);
        (0, cookie_util_1.setCsrfCookie)(res);
        await this.authAuditService.log('LOGIN_SUCCESS', {
            ...meta,
            userId: result.user.id,
        });
        return {
            twoFactorRequired: false,
            user: userPayload,
            subsidiary: result.subsidiary,
        };
    }
    async refresh(req, res) {
        const presentedToken = req.cookies?.[cookie_util_1.REFRESH_TOKEN_COOKIE];
        if (!presentedToken) {
            throw new common_1.UnauthorizedException('Refresh token manquant');
        }
        try {
            const { accessToken, refreshToken } = await this.authService.refresh(presentedToken, {
                userAgent: req.headers['user-agent'],
                ipAddress: req.ip,
            });
            (0, cookie_util_1.setAuthCookies)(res, accessToken, refreshToken);
            (0, cookie_util_1.setCsrfCookie)(res);
            return { message: 'Session renouvelée' };
        }
        catch (error) {
            (0, cookie_util_1.clearAuthCookies)(res);
            throw error;
        }
    }
    async forgotPassword(dto, req) {
        const result = await this.authService.forgotPassword(dto.email);
        await this.authAuditService.log('PASSWORD_RESET_REQUESTED', {
            email: dto.email,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });
        return result;
    }
    async resetPassword(dto) {
        return this.authService.resetPassword(dto.token, dto.password);
    }
    async switchRole(dto, req) {
        return this.authService.switchRole(req.user.id, dto.role);
    }
    async getProfileUser(req) {
        return this.authService.getProfileUser(req.user);
    }
    async updateUser(id, dto, req) {
        return this.authService.updateUser(id, dto, req.user);
    }
    async deleteUser(id, req) {
        return this.authService.deleteUser(id, req.user);
    }
    async getAllUsers(req, paginationQuery) {
        return this.authService.getAllUsers(req.user, paginationQuery);
    }
    async searchUsers(query, req) {
        return this.authService.searchUsers(query, req.user);
    }
    async getAuditLog(query) {
        return this.authAuditService.findMany(query);
    }
    async logout(req, res) {
        const presentedToken = req.cookies?.[cookie_util_1.REFRESH_TOKEN_COOKIE];
        const result = await this.authService.logout(req.user, presentedToken);
        (0, cookie_util_1.clearAuthCookies)(res);
        await this.authAuditService.log('LOGOUT', {
            userId: req.user.id,
            email: req.user.email,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });
        return result;
    }
    async getProfile(req) {
        return this.authService.getProfile(req.user.sub);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN),
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RegisterDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60000 } }),
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [LoginDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 20, ttl: 60000 } }),
    (0, common_1.Post)('refresh'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 3, ttl: 60000 } }),
    (0, common_1.Post)('forgot-password'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ForgotPasswordDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60000 } }),
    (0, common_1.Post)('reset-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Post)('switch-role'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SwitchRoleDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "switchRole", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Get)('Userprofile'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getProfileUser", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.SECRETARY, client_1.UserRole.HR_MANAGER, client_1.UserRole.FINANCIAL_DIRECTOR),
    (0, common_1.Patch)('users/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateUserDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "updateUser", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.SECRETARY, client_1.UserRole.HR_MANAGER, client_1.UserRole.FINANCIAL_DIRECTOR),
    (0, common_1.Delete)('users/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "deleteUser", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.SECRETARY, client_1.UserRole.HR_MANAGER, client_1.UserRole.FINANCIAL_DIRECTOR),
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, GetUsersQueryDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getAllUsers", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.SUPER_ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.SECRETARY, client_1.UserRole.HR_MANAGER, client_1.UserRole.FINANCIAL_DIRECTOR),
    (0, common_1.Get)('users/search'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SearchUsersDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "searchUsers", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN),
    (0, common_1.Get)('audit-log'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [AuditLogQueryDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getAuditLog", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Get)('profile'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getProfile", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        auth_audit_service_1.AuthAuditService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map