import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AccountingAccessService } from './accounting-access.service';
import { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';

/**
 * Protège les routes du module comptabilité : un ADMIN du siège (ou
 * SUPER_ADMIN) passe toujours ; tout autre utilisateur doit avoir une
 * `AccountingAccessRequest` APPROVED et non expirée. À empiler après
 * `JwtAuthGuard` (a besoin de `req.user`).
 */
@Injectable()
export class AccountingAccessGuard implements CanActivate {
  constructor(private readonly accessService: AccountingAccessService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ user?: JwtUser }>();
    const user = req.user;
    if (!user) throw new ForbiddenException('Authentification requise.');

    const allowed = await this.accessService.hasActiveAccess(user);
    if (!allowed) {
      throw new ForbiddenException(
        'Accès comptabilité non autorisé — demandez un accès temporaire (POST /accounting-access/request).',
      );
    }
    return true;
  }
}
