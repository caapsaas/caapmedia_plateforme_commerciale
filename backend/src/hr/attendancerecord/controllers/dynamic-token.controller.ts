import { Controller, Get, UseGuards, Request, Logger, Query, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { RoleGuard } from 'src/common/auth/role/role.guard';
import { Roles } from 'src/common/auth/role/role.decorator';
import { DynamicTokenService } from '../services/dynamic-token.service';

@Controller('hr/dynamic-token')
@UseGuards(JwtAuthGuard, RoleGuard)
export class DynamicTokenController {
  private readonly logger = new Logger(DynamicTokenController.name);

  constructor(private readonly dynamicTokenService: DynamicTokenService) {}

  /**
   * Récupère le token actif global
   * Génère un nouveau token si nécessaire
   */
  @Get('current')
  @Roles('HR_MANAGER', 'ADMIN', 'SUPER_ADMIN')
  async getCurrentToken(@Request() req, @Query('subsidiaryId') requestedId?: string) {
    const subsidiaryId = this.resolveSubsidiary(req.user, requestedId);
    const { token } = await this.dynamicTokenService.getActiveToken(subsidiaryId);

    return {
      token,
      qrUrl: `${process.env.FRONTEND_URL || 'https://caapmedia.com'}/pointage?t=${token}`,
    };
  }

  /**
   * Génère un nouveau token global (force la régénération)
   */
  @Get('generate')
  @Roles('HR_MANAGER', 'ADMIN', 'SUPER_ADMIN')
  async generateNewToken(@Request() req, @Query('subsidiaryId') requestedId?: string) {
    const subsidiaryId = this.resolveSubsidiary(req.user, requestedId);
    const { token } = await this.dynamicTokenService.generateToken(subsidiaryId);

    return {
      token,
      qrUrl: `${process.env.FRONTEND_URL || 'https://caapmedia.com'}/pointage?t=${token}`,
    };
  }

  private resolveSubsidiary(user: any, requestedId?: string): string {
    const isSuperAdmin = user.roles?.includes('SUPER_ADMIN');
    if (requestedId && !isSuperAdmin && requestedId !== user.subsidiaryId) {
      throw new ForbiddenException('Accès limité à votre filiale');
    }
    const subsidiaryId = requestedId || user.subsidiaryId;
    if (!subsidiaryId) throw new ForbiddenException('Filiale requise pour créer le QR code');
    return subsidiaryId;
  }
}
