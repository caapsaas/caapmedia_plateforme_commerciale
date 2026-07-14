import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../utils/prisma/prisma.service';
import { LoggerService } from '../../utils/logger/logger.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService, private logger: LoggerService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Non-null: présence garantie au démarrage par env.validation.ts (fail-fast sinon)
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(payload: any) {
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