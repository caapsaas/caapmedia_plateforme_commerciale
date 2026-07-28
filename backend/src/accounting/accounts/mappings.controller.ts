import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MappingsService } from './mappings.service';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { AccountingAccessGuard } from 'src/accounting-access/accounting-access.guard';

@UseGuards(JwtAuthGuard, AccountingAccessGuard)
@Controller('accounting/mappings')
export class MappingsController {
  constructor(private readonly mappingsService: MappingsService) {}

  @Get()
  findAll() {
    return this.mappingsService.findAll();
  }

  @Patch(':key')
  update(@Param('key') key: string, @Body('accountCode') accountCode: string) {
    return this.mappingsService.update(key, accountCode);
  }

  /**
   * Réimporte les mappings par défaut, indépendamment du plan comptable et des
   * journaux — nécessite que le plan comptable soit déjà initialisé (les clés
   * dont le compte cible est introuvable sont ignorées, voir seedDefaultMappings).
   */
  @Post('seed')
  async seed() {
    const result = await this.mappingsService.seedDefaultMappings();
    return {
      message: `${result.imported} mapping(s) importé(s) avec succès${result.skipped > 0 ? `, ${result.skipped} ignoré(s) (compte introuvable — initialisez le plan comptable d'abord)` : ''}.`,
    };
  }
}
