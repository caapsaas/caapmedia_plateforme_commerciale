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
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      this.logger.error(`User ${user.id} lacks required role`, 'RoleGuard');
      throw new ForbiddenException('Insufficient permissions');
    }
    return hasRole;
  }
}