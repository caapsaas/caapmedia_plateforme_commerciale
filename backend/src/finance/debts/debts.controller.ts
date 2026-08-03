import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { DebtsService } from './debts.service';
import type { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';
import { CurrentUser } from '../../common/auth/role/role.decorator';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';

import { CreateSupplierDebtDto } from './dto/create-supplier-debt.dto';
import { PaySupplierDebtDto } from './dto/pay-supplier-debt.dto';
import { CreateLongTermDebtDto } from './dto/create-long-term-debt.dto';
import { UpdateLongTermDebtDto } from './dto/update-long-term-debt.dto';

@UseGuards(JwtAuthGuard)
@Controller('finance/debts')
export class DebtsController {
  constructor(private readonly debtsService: DebtsService) {}

  // --- Supplier Debts Routes ---
  @Post('supplier')
  createSupplierDebt(
    @Body() createDto: CreateSupplierDebtDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.debtsService.createSupplierDebt(createDto, user);
  }

  @Get('supplier')
  findAllSupplierDebts(
    @CurrentUser() user: JwtUser,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.debtsService.findAllSupplierDebts(user, paginationQuery);
  }

  @Post('supplier/:id/pay')
  paySupplierDebt(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() payDto: PaySupplierDebtDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.debtsService.paySupplierDebt(id, payDto, user);
  }

  // --- Long-Term Debts Routes ---
  @Post('long-term')
  createLongTermDebt(
    @Body() createDto: CreateLongTermDebtDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.debtsService.createLongTermDebt(createDto, user);
  }

  @Get('long-term')
  findAllLongTermDebts(@CurrentUser() user: JwtUser) {
    return this.debtsService.findAllLongTermDebts(user);
  }

  @Patch('long-term/:id')
  updateLongTermDebt(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateLongTermDebtDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.debtsService.updateLongTermDebt(id, updateDto, user);
  }
}
