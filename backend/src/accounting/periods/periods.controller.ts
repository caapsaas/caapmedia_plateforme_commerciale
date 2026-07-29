import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PeriodsService } from './periods.service';
import type { CreateFiscalYearDto } from './periods.service';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { AccountingAccessGuard } from 'src/accounting-access/accounting-access.guard';

@UseGuards(JwtAuthGuard, AccountingAccessGuard)
@Controller('accounting/periods')
export class PeriodsController {
  constructor(private readonly periodsService: PeriodsService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.periodsService.findAll(req.user);
  }

  @Post()
  create(@Body() dto: CreateFiscalYearDto, @Req() req: any) {
    return this.periodsService.create(dto, req.user.subsidiaryId);
  }

  @Patch(':id/close')
  close(@Param('id') id: string, @Req() req: any) {
    return this.periodsService.close(id, req.user);
  }

  @Patch(':id/reopen')
  reopen(@Param('id') id: string, @Req() req: any) {
    return this.periodsService.reopen(id, req.user);
  }
}
