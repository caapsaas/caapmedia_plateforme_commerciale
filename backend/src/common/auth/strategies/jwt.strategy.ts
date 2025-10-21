// Dans src/auth/strategies/jwt.strategy.ts

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../../auth/auth/auth.service'; // Assurez-vous que le chemin est correct

type JwtPayload = {
  sub: string;
  email: string;
  role: string;
  subsidiaryId: string;
  type?: 'user'; // Ajout optionnel pour différencier des contacts
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ? process.env.JWT_SECRET : 'your-secure-secret-key',
    });
  }

  async validate(payload: JwtPayload) {
    // `payload` contient le JWT décodé (ex: { email: '...', sub: '...' })
    // On utilise l'ID (sub) pour retrouver l'utilisateur complet.
    const user = await this.authService.findOneById(payload.sub);
    
    // Passport.js attachera l'objet `user` retourné à la propriété `req.user`.
    // Excluez le mot de passe pour des raisons de sécurité.
    if (user) {
      const { passwordHash, ...result } = user;
      return result;
    }
    
    return null; // Ou lancez une UnauthorizedException si l'utilisateur n'est pas trouvé
  }
}
