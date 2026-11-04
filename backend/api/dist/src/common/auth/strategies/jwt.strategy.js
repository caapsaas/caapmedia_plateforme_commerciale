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
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const prisma_service_1 = require("../../utils/prisma/prisma.service");
const logger_service_1 = require("../../utils/logger/logger.service");
const cookie_util_1 = require("../cookie.util");
function cookieOrBearerExtractor(req) {
    const cookieToken = req.cookies?.[cookie_util_1.ACCESS_TOKEN_COOKIE];
    if (cookieToken)
        return cookieToken;
    return passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken()(req);
}
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    prisma;
    logger;
    constructor(prisma, logger) {
        super({
            jwtFromRequest: cookieOrBearerExtractor,
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET,
        });
        this.prisma = prisma;
        this.logger = logger;
    }
    async validate(payload) {
        if (payload.type === 'pending_2fa') {
            this.logger.error("Tentative d'utilisation d'un pending_2fa token comme access token", 'JwtStrategy');
            return null;
        }
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            include: { subsidiary: true },
        });
        if (!user) {
            this.logger.error(`User with ID ${payload.sub} not found`, 'JwtStrategy');
            return null;
        }
        let employeeId = null;
        try {
            const employee = await this.prisma.employee.findUnique({
                where: { email: user.email },
            });
            if (employee) {
                employeeId = employee.id;
            }
        }
        catch (error) {
            this.logger.warn(`Could not find employee for email ${user.email}`, 'JwtStrategy');
        }
        const roles = user.roles.length > 0
            ? user.roles
            : [
                user.userRole,
                ...user.additionalRoles.filter((r) => r !== user.userRole),
            ];
        return {
            id: user.id,
            email: user.email,
            role: user.userRole,
            userRole: user.userRole,
            roles,
            activeRole: user.activeRole ?? user.userRole,
            subsidiaryId: user.subsidiaryId,
            employeeId,
        };
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        logger_service_1.LoggerService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map