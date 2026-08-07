import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CashRemittanceService } from './cash-remittance.service';
import { CreateCashRemittanceDto } from './dto/create-cash-remittance.dto';
import { ReceiveCashRemittanceDto } from './dto/receive-cash-remittance.dto';
import type { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';
import { CurrentUser } from 'src/common/auth/role/role.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('finance/cash-remittances')
export class CashRemittanceController {
  constructor(private readonly cashRemittanceService: CashRemittanceService) {}

  @Post()
  create(@Body() dto: CreateCashRemittanceDto, @CurrentUser() user: JwtUser) {
    return this.cashRemittanceService.create(dto, user);
  }

  @Get()
  findAll(@CurrentUser() user: JwtUser) {
    return this.cashRemittanceService.findAll(user);
  }

  @Patch(':id/receive')
  receive(
    @Param('id') id: string,
    @Body() dto: ReceiveCashRemittanceDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.cashRemittanceService.receive(id, dto, user);
  }
}
