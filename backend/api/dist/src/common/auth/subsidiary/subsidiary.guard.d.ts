import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LoggerService } from '../../utils/logger/logger.service';
export declare class SubsidiaryGuard implements CanActivate {
    private reflector;
    private logger;
    constructor(reflector: Reflector, logger: LoggerService);
    canActivate(context: ExecutionContext): boolean;
}
