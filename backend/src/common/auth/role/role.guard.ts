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
    
    const userRole = user.role || user.userRole;
    this.logger.debug(`User ${user.id} has role: ${userRole}`, 'RoleGuard');
    
    if (!userRole) {
      this.logger.error(`User ${user.id} has no role defined for ${method} ${url}`, 'RoleGuard');
      throw new ForbiddenException('User role not defined');
    }
    
    const hasRole = requiredRoles.includes(userRole);
    if (!hasRole) {
      this.logger.error(`User ${user.id} lacks required role for ${method} ${url}. Has: ${userRole}, Required: ${requiredRoles.join(', ')}`, 'RoleGuard');
      throw new ForbiddenException('Insufficient permissions');
    }
    
    this.logger.debug(`User ${user.id} has required role for ${method} ${url}`, 'RoleGuard');
    return hasRole;
  }
}