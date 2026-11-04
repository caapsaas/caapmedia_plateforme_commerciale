"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwoFactorController = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const throttler_1 = require("@nestjs/throttler");
const class_validator_1 = require("class-validator");
const bcrypt = __importStar(require("bcryptjs"));
const prisma_service_1 = require("../../utils/prisma/prisma.service");
const jwt_guard_1 = require("../jwt/jwt.guard");
const two_factor_service_1 = require("./two-factor.service");
const auth_service_1 = require("../auth/auth.service");
const auth_audit_service_1 = require("../auth/auth-audit.service");
const cookie_util_1 = require("../cookie.util");
class TwoFactorCodeDto {
    code;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], TwoFactorCodeDto.prototype, "code", void 0);
class TwoFactorDisableDto {
    password;
    code;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TwoFactorDisableDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], TwoFactorDisableDto.prototype, "code", void 0);
class TwoFactorLoginDto {
    pendingToken;
    code;
    recoveryCode;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TwoFactorLoginDto.prototype, "pendingToken", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TwoFactorLoginDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TwoFactorLoginDto.prototype, "recoveryCode", void 0);
let TwoFactorController = class TwoFactorController {
    twoFactorService;
    authService;
    authAuditService;
    prisma;
    jwtService;
    constructor(twoFactorService, authService, authAuditService, prisma, jwtService) {
        this.twoFactorService = twoFactorService;
        this.authService = authService;
        this.authAuditService = authAuditService;
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async setup(req) {
        const user = await this.prisma.user.findUnique({
            where: { id: req.user.id },
        });
        if (!user)
            throw new common_1.NotFoundException('Utilisateur introuvable');
        if (user.twoFactorEnabled)
            throw new common_1.ConflictException('La double authentification est deja activee');
        const secret = this.twoFactorService.generateSecret();
        await this.prisma.user.update({
            where: { id: user.id },
            data: { twoFactorSecret: secret },
        });
        const qrCodeDataUrl = await this.twoFactorService.generateQrCodeDataUrl(user.email, secret);
        return { qrCodeDataUrl, secret };
    }
    async verify(req, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: req.user.id },
        });
        if (!user?.twoFactorSecret) {
            throw new common_1.BadRequestException("Aucune configuration 2FA en attente - appelez /auth/2fa/setup d'abord");
        }
        const isValid = await this.twoFactorService.verifyToken(user.twoFactorSecret, dto.code);
        if (!isValid)
            throw new common_1.UnauthorizedException('Code invalide');
        const recoveryCodes = this.twoFactorService.generateRecoveryCodes();
        const hashedCodes = recoveryCodes.map((c) => this.twoFactorService.hashRecoveryCode(c));
        await this.prisma.user.update({
            where: { id: user.id },
            data: { twoFactorEnabled: true, twoFactorRecoveryCodes: hashedCodes },
        });
        await this.authAuditService.log('TWO_FACTOR_ENABLED', {
            userId: user.id,
            email: user.email,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });
        return { message: 'Double authentification activee', recoveryCodes };
    }
    async disable(req, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: req.user.id },
        });
        if (!user)
            throw new common_1.NotFoundException('Utilisateur introuvable');
        if (!(await bcrypt.compare(dto.password, user.passwordHash))) {
            throw new common_1.UnauthorizedException('Mot de passe incorrect');
        }
        if (!user.twoFactorSecret ||
            !(await this.twoFactorService.verifyToken(user.twoFactorSecret, dto.code))) {
            throw new common_1.UnauthorizedException('Code invalide');
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null,
                twoFactorRecoveryCodes: [],
            },
        });
        await this.authAuditService.log('TWO_FACTOR_DISABLED', {
            userId: user.id,
            email: user.email,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });
        return { message: 'Double authentification desactivee' };
    }
    async login(dto, req, res) {
        if (!dto.code && !dto.recoveryCode) {
            throw new common_1.BadRequestException('code ou recoveryCode requis');
        }
        let payload;
        try {
            payload = this.jwtService.verify(dto.pendingToken);
        }
        catch {
            throw new common_1.UnauthorizedException('Session 2FA expiree, reconnectez-vous');
        }
        if (payload.type !== 'pending_2fa') {
            throw new common_1.UnauthorizedException('Token invalide');
        }
        const meta = {
            userId: payload.sub,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        };
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            include: { subsidiary: true },
        });
        if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
            throw new common_1.UnauthorizedException('Session invalide');
        }
        let authenticated = false;
        if (dto.code) {
            authenticated = await this.twoFactorService.verifyToken(user.twoFactorSecret, dto.code);
        }
        else if (dto.recoveryCode) {
            const hashed = this.twoFactorService.hashRecoveryCode(dto.recoveryCode);
            if (user.twoFactorRecoveryCodes.includes(hashed)) {
                authenticated = true;
                await this.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        twoFactorRecoveryCodes: user.twoFactorRecoveryCodes.filter((c) => c !== hashed),
                    },
                });
            }
        }
        if (!authenticated) {
            await this.authAuditService.log('TWO_FACTOR_LOGIN_FAILED', {
                ...meta,
                email: user.email,
            });
            throw new common_1.UnauthorizedException('Code invalide');
        }
        const { accessToken, refreshToken, user: userPayload, } = await this.authService.issueTokens(user, {
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip,
        });
        (0, cookie_util_1.setAuthCookies)(res, accessToken, refreshToken);
        (0, cookie_util_1.setCsrfCookie)(res);
        await this.authAuditService.log('TWO_FACTOR_LOGIN_SUCCESS', {
            ...meta,
            email: user.email,
        });
        return { user: userPayload, subsidiary: user.subsidiary };
    }
};
exports.TwoFactorController = TwoFactorController;
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Post)('setup'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TwoFactorController.prototype, "setup", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60000 } }),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Post)('verify'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, TwoFactorCodeDto]),
    __metadata("design:returntype", Promise)
], TwoFactorController.prototype, "verify", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60000 } }),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Post)('disable'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, TwoFactorDisableDto]),
    __metadata("design:returntype", Promise)
], TwoFactorController.prototype, "disable", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60000 } }),
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TwoFactorLoginDto, Object, Object]),
    __metadata("design:returntype", Promise)
], TwoFactorController.prototype, "login", null);
exports.TwoFactorController = TwoFactorController = __decorate([
    (0, common_1.Controller)('auth/2fa'),
    __metadata("design:paramtypes", [two_factor_service_1.TwoFactorService,
        auth_service_1.AuthService,
        auth_audit_service_1.AuthAuditService,
        prisma_service_1.PrismaService,
        jwt_1.JwtService])
], TwoFactorController);
//# sourceMappingURL=two-factor.controller.js.map