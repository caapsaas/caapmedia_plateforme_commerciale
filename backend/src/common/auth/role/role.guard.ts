import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LoggerService } from '../../utils/logger/logger.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector, private logger: LoggerService) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>('roles', context.getHandler());
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.error('No user found in request', 'RoleGuard');
      return false;
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      this.logger.warn(`User ${user.email} does not have required role: ${requiredRoles}`, 'RoleGuard');
    }
    return hasRole;
  }
}