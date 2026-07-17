import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client'; // Ou votre enum

@Injectable()
export class RoleGuard implements CanActivate {
  private readonly logger = new Logger(RoleGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const url = request.url;
    const method = request.method;

    this.logger.debug(`RoleGuard checking: ${method} ${url}`, 'RoleGuard');

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      'roles',
      [context.getHandler(), context.getClass()],
    );

    this.logger.debug(
      `Required roles: ${requiredRoles ? requiredRoles.join(', ') : 'none'}`,
      'RoleGuard',
    );

    if (!requiredRoles) {
      this.logger.debug(
        `No roles required for ${method} ${url}, allowing access`,
        'RoleGuard',
      );
      return true;
    }

    const user = request.user;

    if (!user) {
      this.logger.error(
        `No user found in request for ${method} ${url}`,
        'RoleGuard',
      );
      throw new ForbiddenException('User not authenticated');
    }

    // SUPER_ADMIN bypasse tout check de role: l'ajouter a la main a chaque
    // @Roles(...)/@SetMetadata('roles', ...) de l'app serait fragile (c'est
    // exactement l'oubli qui a laisse finances-stats/* sans guard, cf. audit
    // Doc/architecture-multi-filiale-auth-rbac.md section 1.1/4.2).
    if (user.roles?.includes(UserRole.SUPER_ADMIN)) {
      this.logger.debug(
        `User ${user.id} is SUPER_ADMIN, bypassing role check for ${method} ${url}`,
        'RoleGuard',
      );
      return true;
    }

    // L'autorisation se base UNIQUEMENT sur activeRole (POST /auth/switch-role,
    // voir jwt.strategy.ts) - un utilisateur multi-role qui n'a pas switche
    // vers un role donne ne peut pas agir avec les permissions de ce role,
    // meme s'il le possede. Avant l'introduction d'activeRole, ce guard
    // faisait un OR sur TOUS les roles de l'utilisateur (roles[]/
    // additionalRoles), ce qui contournait le principe de moindre privilege.
    const activeRole: UserRole | undefined =
      user.activeRole || user.role || user.userRole;
    this.logger.debug(
      `User ${user.id} active role: ${activeRole}`,
      'RoleGuard',
    );

    if (!activeRole) {
      this.logger.error(
        `User ${user.id} has no role defined for ${method} ${url}`,
        'RoleGuard',
      );
      throw new ForbiddenException('User role not defined');
    }

    const hasRole = requiredRoles.includes(activeRole);
    if (!hasRole) {
      this.logger.error(
        `User ${user.id} lacks required role for ${method} ${url}. Active: ${activeRole}, Required: ${requiredRoles.join(', ')}`,
        'RoleGuard',
      );
      throw new ForbiddenException('Insufficient permissions');
    }

    this.logger.debug(
      `User ${user.id} has required role for ${method} ${url}`,
      'RoleGuard',
    );
    return hasRole;
  }
}
