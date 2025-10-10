import { Controller, Get, Query, UseGuards, SetMetadata, Req } from '@nestjs/common';
import { FinancesStatsService } from './finances_stats.service';
import { PeriodFilterDto } from '../analytics/dto/period-filter.dto';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { RoleGuard } from 'src/common/auth/role/role.guard';
import { User, UserRole } from '@prisma/client';

@Controller('finances-stats')
@UseGuards(JwtAuthGuard, RoleGuard)
@SetMetadata('roles', [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR])
export class FinancesStatsController {
  constructor(private readonly financesStatsService: FinancesStatsService) {}

  @Get('customer-receivables')
  getCustomerReceivables(@Req() req: any, @Query() periodFilterDto: PeriodFilterDto) {
    return this.financesStatsService.getCustomerReceivables(req.user, periodFilterDto);
  }

  @Get('supplier-debts')
  getSupplierDebts(@Req() req: any, @Query() periodFilterDto: PeriodFilterDto) {
    return this.financesStatsService.getSupplierDebts(req.user, periodFilterDto);
  }

  @Get('pnl-statement')
  getPnlStatement(@Req() req: any, @Query() periodFilterDto: PeriodFilterDto) {
    return this.financesStatsService.getPnlStatement(req.user, periodFilterDto);
  }

  @Get('balance-sheet')
  getBalanceSheet(@Req() req: any) {
    return this.financesStatsService.getBalanceSheet(req.user);
  }

  @Get('crm-analysis')
  @SetMetadata('roles', [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR, UserRole.COMMERCIAL])
  getCrmAnalysis(@Req() req: any, @Query() periodFilterDto: PeriodFilterDto) {
    return this.financesStatsService.getCrmAnalysis(req.user, periodFilterDto);
  }
}
