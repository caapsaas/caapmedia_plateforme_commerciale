import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';  // Ou votre enum

@Injectable()
export class RoleGuard implements CanActivate {
  private readonly logger = new Logger(RoleGuard.name);

  constructor(
    private reflector: Reflector
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const url = request.url;
    const method = request.method;
    
    this.logger.debug(`RoleGuard checking: ${method} ${url}`, 'RoleGuard');
    
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    this.logger.debug(`Required roles: ${requiredRoles ? requiredRoles.join(', ') : 'none'}`, 'RoleGuard');
    
    if (!requiredRoles) {
      this.logger.debug(`No roles required for ${method} ${url}, allowing access`, 'RoleGuard');
      return true;
    }
    
    const user = request.user;
    
    if (!user) {
      this.logger.error(`No user found in request for ${method} ${url}`, 'RoleGuard');
      throw new ForbiddenException('User not authenticated');
    }
    
    // SUPER_ADMIN bypasse tout check de role: l'ajouter a la main a chaque
    // @Roles(...)/@SetMetadata('roles', ...) de l'app serait fragile (c'est
    // exactement l'oubli qui a laisse finances-stats/* sans guard, cf. audit
    // Doc/architecture-multi-filiale-auth-rbac.md section 1.1/4.2).
    if (user.roles?.includes(UserRole.SUPER_ADMIN)) {
      this.logger.debug(`User ${user.id} is SUPER_ADMIN, bypassing role check for ${method} ${url}`, 'RoleGuard');
      return true;
    }

    // roles[] est la source de verite RBAC (voir jwt.strategy.ts): un
    // utilisateur avec des additionalRoles doit passer si N'IMPORTE LEQUEL de
    // ses roles matche - meme logique OR que checkRole() et useHasRole() cote
    // frontend. Se limiter a user.role (le seul role principal) ignorait
    // additionalRoles et etait incoherent avec ces deux autres mecanismes.
    const userRoles: UserRole[] = user.roles?.length ? user.roles : [user.role || user.userRole].filter(Boolean);
    this.logger.debug(`User ${user.id} has roles: ${userRoles.join(', ')}`, 'RoleGuard');

    if (userRoles.length === 0) {
      this.logger.error(`User ${user.id} has no role defined for ${method} ${url}`, 'RoleGuard');
      throw new ForbiddenException('User role not defined');
    }

    const hasRole = requiredRoles.some((r) => userRoles.includes(r));
    if (!hasRole) {
      this.logger.error(`User ${user.id} lacks required role for ${method} ${url}. Has: ${userRoles.join(', ')}, Required: ${requiredRoles.join(', ')}`, 'RoleGuard');
      throw new ForbiddenException('Insufficient permissions');
    }

    this.logger.debug(`User ${user.id} has required role for ${method} ${url}`, 'RoleGuard');
    return hasRole;
  }
}