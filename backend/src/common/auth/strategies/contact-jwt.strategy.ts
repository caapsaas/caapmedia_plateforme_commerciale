import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';

type JwtPayload = {
  sub: string;
  email: string;
  type: 'contact';
};

@Injectable()
export class ContactJwtStrategy extends PassportStrategy(Strategy, 'jwt-contact') {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Non-null: présence garantie au démarrage par env.validation.ts (fail-fast sinon)
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.type !== 'contact') {
      throw new UnauthorizedException('Invalid token type.');
    }
    const contact = await this.prisma.contact.findUnique({ where: { id: payload.sub } });

    if (!contact) {
      throw new UnauthorizedException('Contact not found or access revoked.');
    }
    // Le contact est valide, Passport va l'attacher à `req.user`
    return contact;
  }
}
