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
var RoleGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const role_identity_1 = require("./role-identity");
let RoleGuard = RoleGuard_1 = class RoleGuard {
    reflector;
    logger = new common_1.Logger(RoleGuard_1.name);
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const url = request.url;
        const method = request.method;
        this.logger.debug(`RoleGuard checking: ${method} ${url}`, 'RoleGuard');
        const requiredRoles = this.reflector.getAllAndOverride('roles', [context.getHandler(), context.getClass()]);
        this.logger.debug(`Required roles: ${requiredRoles ? requiredRoles.join(', ') : 'none'}`, 'RoleGuard');
        if (!requiredRoles) {
            this.logger.debug(`No roles required for ${method} ${url}, allowing access`, 'RoleGuard');
            return true;
        }
        const user = request.user;
        if (!user) {
            this.logger.error(`No user found in request for ${method} ${url}`, 'RoleGuard');
            throw new common_1.ForbiddenException('User not authenticated');
        }
        if ((0, role_identity_1.isSuperAdmin)(user)) {
            this.logger.debug(`User ${user.id} is SUPER_ADMIN, bypassing role check for ${method} ${url}`, 'RoleGuard');
            return true;
        }
        const activeRole = (0, role_identity_1.getActiveRole)(user);
        this.logger.debug(`User ${user.id} active role: ${activeRole}`, 'RoleGuard');
        if (!activeRole) {
            this.logger.error(`User ${user.id} has no role defined for ${method} ${url}`, 'RoleGuard');
            throw new common_1.ForbiddenException('User role not defined');
        }
        const hasRole = requiredRoles.includes(activeRole);
        if (!hasRole) {
            this.logger.error(`User ${user.id} lacks required role for ${method} ${url}. Active: ${activeRole}, Required: ${requiredRoles.join(', ')}`, 'RoleGuard');
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
        this.logger.debug(`User ${user.id} has required role for ${method} ${url}`, 'RoleGuard');
        return hasRole;
    }
};
exports.RoleGuard = RoleGuard;
exports.RoleGuard = RoleGuard = RoleGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], RoleGuard);
//# sourceMappingURL=role.guard.js.map