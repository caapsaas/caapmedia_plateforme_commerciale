import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../../utils/prisma/prisma.service';
import { LoggerService } from '../../utils/logger/logger.service';

const REFRESH_TOKEN_BYTES = 64;
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours

export interface IssuedRefreshToken {
  token: string; // valeur en clair, a placer dans le cookie httpOnly
  expiresAt: Date;
}

export interface RequestMeta {
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Gere le cycle de vie des refresh tokens (emission, rotation, revocation).
 * Seul le hash SHA-256 du token est stocke en base - le token en clair
 * n'existe que dans le cookie httpOnly du navigateur, jamais persiste.
 *
 * Contrairement a l'access token JWT (stateless, ne peut pas etre invalide
 * avant expiration), le refresh token est stocke en base et peut donc etre
 * revoque immediatement (logout, detection de vol).
 */
@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async issue(userId: string, meta: RequestMeta = {}): Promise<IssuedRefreshToken> {
    const token = randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hash(token),
        expiresAt,
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
      },
    });

    return { token, expiresAt };
  }

  /**
   * Verifie un refresh token, le revoque (rotation) et en emet un nouveau
   * pour le meme utilisateur. Si le token fourni a deja ete revoque
   * (reutilisation d'un token vole apres rotation), toutes les sessions de
   * l'utilisateur sont revoquees par precaution.
   */
  async rotate(presentedToken: string, meta: RequestMeta = {}): Promise<{ userId: string; issued: IssuedRefreshToken }> {
    const tokenHash = this.hash(presentedToken);
    const existing = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!existing) {
      throw new UnauthorizedException('Refresh token invalide');
    }

    if (existing.revokedAt) {
      this.logger.warn(`Refresh token deja revoque reutilise pour user ${existing.userId} - revocation de toutes ses sessions`, 'RefreshTokenService');
      await this.revokeAllForUser(existing.userId);
      throw new UnauthorizedException('Refresh token invalide');
    }

    if (existing.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expire');
    }

    await this.prisma.refreshToken.update({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });

    const issued = await this.issue(existing.userId, meta);
    return { userId: existing.userId, issued };
  }

  async revoke(presentedToken: string): Promise<void> {
    const tokenHash = this.hash(presentedToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
