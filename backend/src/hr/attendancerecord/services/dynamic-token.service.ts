import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DynamicTokenService {
  private readonly logger = new Logger(DynamicTokenService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Génère un nouveau token dynamique global
   * Le token n'expire pas (pour QR code imprimé)
   * Fonctionne pour tous les employés actifs, peu importe la filiale
   */
  async generateToken(): Promise<{ token: string }> {
    const token = uuidv4();
    const now = new Date();

    // Marquer tous les anciens tokens comme inactifs
    await this.prisma.dynamicToken.updateMany({
      where: {
        isUsed: false,
      },
      data: {
        isUsed: true,
        usedAt: now,
      },
    });

    const dynamicToken = await this.prisma.dynamicToken.create({
      data: {
        id: uuidv4(),
        subsidiaryId: null, // Token global, non lié à une filiale (voir DynamicToken.subsidiaryId dans schema.prisma)
        token,
        createdAt: now,
        expiresAt: new Date('2099-12-31'), // Date lointaine pour ne pas expirer
        isUsed: false,
      },
    });

    this.logger.log(`Generated global dynamic token`);

    return {
      token: dynamicToken.token,
    };
  }

  /**
   * Valide un token dynamique global
   * Vérifie que le token existe et n'a pas été utilisé
   * Le token n'expire pas (pour QR code imprimé)
   */
  async validateToken(token: string): Promise<void> {
    this.logger.log(`Validating global token: ${token}`);
    const dynamicToken = await this.prisma.dynamicToken.findUnique({
      where: { token },
    });

    if (!dynamicToken) {
      this.logger.warn(`Token not found in database: ${token}`);
      // Log tous les tokens existants pour debug
      const allTokens = await this.prisma.dynamicToken.findMany({
        select: {
          id: true,
          token: true,
          subsidiaryId: true,
          isUsed: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
      this.logger.log(
        `Existing tokens in database:`,
        JSON.stringify(allTokens, null, 2),
      );
      throw new BadRequestException('Token invalide');
    }

    this.logger.log(
      `Token found: ${dynamicToken.id}, isUsed: ${dynamicToken.isUsed}, subsidiaryId: ${dynamicToken.subsidiaryId}`,
    );

    if (dynamicToken.isUsed) {
      this.logger.warn(`Token already used: ${token}`);
      throw new BadRequestException('Ce token a déjà été utilisé');
    }

    this.logger.log(`Global token validated successfully`);
  }

  /**
   * Marque un token comme utilisé
   */
  async markTokenAsUsed(token: string): Promise<void> {
    await this.prisma.dynamicToken.update({
      where: { token },
      data: {
        isUsed: true,
        usedAt: new Date(),
      },
    });

    this.logger.log(`Marked token as used: ${token}`);
  }

  /**
   * Récupère le token actif le plus récent (global)
   * S'il n'existe pas, en génère un nouveau
   */
  async getActiveToken(): Promise<{ token: string }> {
    // Chercher un token global non utilisé
    const activeToken = await this.prisma.dynamicToken.findFirst({
      where: {
        subsidiaryId: null,
        isUsed: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (activeToken) {
      return {
        token: activeToken.token,
      };
    }

    // Sinon, en générer un nouveau
    return this.generateToken();
  }
}
