import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LoggerService } from '../../utils/logger/logger.service';

@Injectable()
export class SubsidiaryGuard implements CanActivate {
  constructor(private reflector: Reflector, private logger: LoggerService) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredSubsidiaryId = this.reflector.get<string>('subsidiaryId', context.getHandler());
    if (!requiredSubsidiaryId) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.error('No user found in request', 'SubsidiaryGuard');
      return false;
    }

    const hasAccess = user.subsidiaryId === requiredSubsidiaryId;
    if (!hasAccess) {
      this.logger.warn(`User ${user.email} does not have access to subsidiary ${requiredSubsidiaryId}`, 'SubsidiaryGuard');
    }
    return hasAccess;
  }
}