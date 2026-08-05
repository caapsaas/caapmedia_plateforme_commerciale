import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { TaxTransparencyService } from './tax-transparency.service';
import { TaxTransparencyPeriodDto } from './dto/tax-transparency-period.dto';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { RoleGuard } from 'src/common/auth/role/role.guard';
import { Roles, CurrentUser } from 'src/common/auth/role/role.decorator';
import type { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';
import { UserRole } from '@prisma/client';

@Controller('finance/tax-transparency')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles(UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR)
export class TaxTransparencyController {
  constructor(
    private readonly taxTransparencyService: TaxTransparencyService,
  ) {}

  @Get('payroll-summary')
  getPayrollSummary(
    @Query() query: TaxTransparencyPeriodDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.taxTransparencyService.getPayrollSummary(query, user);
  }

  @Get('vat-summary')
  getVatSummary(
    @Query() query: TaxTransparencyPeriodDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.taxTransparencyService.getVatSummary(query, user);
  }

  @Get('irpp-detail')
  getIrppDetail(
    @Query() query: TaxTransparencyPeriodDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.taxTransparencyService.getIrppDetail(query, user);
  }

  @Get('cnps-detail')
  getCnpsDetail(
    @Query() query: TaxTransparencyPeriodDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.taxTransparencyService.getCnpsDetail(query, user);
  }

  @Get('cfc-fne-detail')
  getCfcFneDetail(
    @Query() query: TaxTransparencyPeriodDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.taxTransparencyService.getCfcFneDetail(query, user);
  }

  @Get('vat-detail')
  getVatDetail(
    @Query() query: TaxTransparencyPeriodDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.taxTransparencyService.getVatDetail(query, user);
  }
}
