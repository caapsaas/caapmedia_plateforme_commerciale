import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import type { CreateAccountDto } from './accounts.service';
import { JournalsService } from '../journals/journals.service';
import { MappingsService } from './mappings.service';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { AccountingAccessGuard } from 'src/accounting-access/accounting-access.guard';
import type { AccountingAccountType } from '@prisma/client';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';

@UseGuards(JwtAuthGuard, AccountingAccessGuard)
@Controller('accounting/accounts')
export class AccountsController {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly journalsService: JournalsService,
    private readonly mappingsService: MappingsService,
  ) {}

  /**
   * Initialise le plan comptable SYSCOHADA + les journaux + les mappings par
   * défaut (référentiels globaux). À appeler une seule fois lors du premier
   * usage du module comptabilité.
   */
  @Post('seed')
  async seed() {
    await this.accountsService.seedSyscohada();
    await this.journalsService.seedDefaultJournals();
    await this.mappingsService.seedDefaultMappings();
    return {
      message:
        'Plan comptable SYSCOHADA, journaux et mappings initialisés avec succès.',
    };
  }

  @Post()
  create(@Body() dto: CreateAccountDto) {
    return this.accountsService.create(dto);
  }

  @Get()
  findAll(
    @Query() paginationQuery: PaginationQueryDto,
    @Query('type') type?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.accountsService.findAll(
      paginationQuery,
      type as AccountingAccountType,
      includeInactive === 'true',
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accountsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateAccountDto>) {
    return this.accountsService.update(id, dto);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.accountsService.deactivate(id);
  }
}
