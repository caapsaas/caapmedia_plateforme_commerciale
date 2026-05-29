import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import type { CreateAccountDto } from './accounts.service';
import { JournalsService } from '../journals/journals.service';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import type { AccountingAccountType } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('accounting/accounts')
export class AccountsController {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly journalsService: JournalsService,
  ) {}

  /**
   * Initialise le plan comptable SYSCOHADA + les 4 journaux pour la filiale.
   * À appeler une seule fois lors du premier usage du module comptabilité.
   */
  @Post('seed')
  async seed(@Req() req: any) {
    const { subsidiaryId } = req.user;
    await this.accountsService.seedSyscohada(subsidiaryId);
    await this.journalsService.seedDefaultJournals(subsidiaryId);
    return { message: 'Plan comptable SYSCOHADA et journaux initialisés avec succès.' };
  }

  @Post()
  create(@Body() dto: CreateAccountDto, @Req() req: any) {
    return this.accountsService.create(dto, req.user);
  }

  @Get()
  findAll(@Req() req: any, @Query('type') type?: string) {
    return this.accountsService.findAll(req.user, type as any);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.accountsService.findOne(id, req.user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateAccountDto>, @Req() req: any) {
    return this.accountsService.update(id, dto, req.user);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string, @Req() req: any) {
    return this.accountsService.deactivate(id, req.user);
  }
}
