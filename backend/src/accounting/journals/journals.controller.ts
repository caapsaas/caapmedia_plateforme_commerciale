import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JournalsService } from './journals.service';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { AccountingAccessGuard } from 'src/accounting-access/accounting-access.guard';

@UseGuards(JwtAuthGuard, AccountingAccessGuard)
@Controller('accounting/journals')
export class JournalsController {
  constructor(private readonly journalsService: JournalsService) {}

  @Get()
  findAll() {
    return this.journalsService.findAll();
  }

  /** Réimporte les 5 journaux SYSCOHADA par défaut, indépendamment du plan comptable. */
  @Post('seed')
  async seed() {
    await this.journalsService.seedDefaultJournals();
    return { message: 'Journaux SYSCOHADA initialisés avec succès.' };
  }
}
