import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../utils/prisma/prisma.service';
import { LoggerService } from '../../utils/logger/logger.service';
import { ACCESS_TOKEN_COOKIE } from '../cookie.util';

/**
 * Priorite au cookie httpOnly (mecanisme normal depuis la migration cookie),
 * fallback sur le header Authorization Bearer pour les clients API/outils
 * qui ne portent pas de cookie (ex: tests, integrations externes).
 */
function cookieOrBearerExtractor(req: Request): string | null {
  const cookieToken = req.cookies?.[ACCESS_TOKEN_COOKIE];
  if (cookieToken) return cookieToken;
  return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService, private logger: LoggerService) {
    super({
      jwtFromRequest: cookieOrBearerExtractor,
      ignoreExpiration: false,
      // Non-null: présence garantie au démarrage par env.validation.ts (fail-fast sinon)
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(payload: any) {
    // Token intermediaire 2FA (voir auth.service.ts login()): ne doit JAMAIS
    // etre accepte comme access token, meme s'il porte un `sub` valide -
    // sinon un token pending vole permettrait de contourner le 2eme facteur.
    if (payload.type === 'pending_2fa') {
      this.logger.error('Tentative d\'utilisation d\'un pending_2fa token comme access token', 'JwtStrategy');
      return null;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { subsidiary: true },
    });
    if (!user) {
      this.logger.error(`User with ID ${payload.sub} not found`, 'JwtStrategy');
      return null;
    }
    // roles[] est la source de verite RBAC (backfillee/maintenue en synchro avec userRole+additionalRoles)
    const roles = user.roles.length > 0 ? user.roles : [user.userRole, ...user.additionalRoles.filter(r => r !== user.userRole)];
    return {
      id: user.id,
      email: user.email,
      role: user.userRole,
      roles,
      subsidiaryId: user.subsidiaryId,
    };
  }
}