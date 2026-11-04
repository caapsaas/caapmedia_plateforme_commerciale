import { CanActivate, ExecutionContext } from '@nestjs/common';
import { AccountingAccessService } from './accounting-access.service';
export declare class AccountingAccessGuard implements CanActivate {
    private readonly accessService;
    constructor(accessService: AccountingAccessService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
