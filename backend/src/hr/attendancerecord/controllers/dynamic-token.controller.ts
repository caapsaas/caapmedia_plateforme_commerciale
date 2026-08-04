import { Controller, Get, UseGuards, Request, Logger } from '@nestjs/common';
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
  async getCurrentToken(@Request() req) {
    this.logger.log(`Fetching current global token`);

    const { token } = await this.dynamicTokenService.getActiveToken();

    return {
      token,
      qrUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pointage?t=${token}`,
    };
  }

  /**
   * Génère un nouveau token global (force la régénération)
   */
  @Get('generate')
  @Roles('HR_MANAGER', 'ADMIN', 'SUPER_ADMIN')
  async generateNewToken(@Request() req) {
    this.logger.log(`Generating new global token`);

    const { token } = await this.dynamicTokenService.generateToken();

    return {
      token,
      qrUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pointage?t=${token}`,
    };
  }
}
