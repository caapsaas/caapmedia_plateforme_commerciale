import { Controller, Get, Query, UseGuards, SetMetadata, Req } from '@nestjs/common';
import { FinancesStatsService } from './finances_stats.service';
import { PeriodFilterDto } from '../analytics/dto/period-filter.dto';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { RoleGuard } from 'src/common/auth/role/role.guard';
import { Roles } from 'src/common/auth/role/role.decorator';
import { UserRole } from '@prisma/client';

@Controller('finances-stats')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles(UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR)
export class FinancesStatsController {
  constructor(private readonly financesStatsService: FinancesStatsService) {}

  /**
   * Methode pour récupérer le solde des créances clients.
   * Exemple d'url: /finances-stats/customer-receivables?period=THIS_MONTH
   */
  @Get('customer-receivables')
  getCustomerReceivables(@Req() req: any, @Query() periodFilterDto: PeriodFilterDto) {
    return this.financesStatsService.getCustomerReceivables(req.user, periodFilterDto);
  }

  /**
   * Methode pour récupérer le solde des dettes fournisseurs.
   * Exemple d'url: /finances-stats/supplier-debts?period=THIS_MONTH
   */
  @Get('supplier-debts')
  getSupplierDebts(@Req() req: any, @Query() periodFilterDto: PeriodFilterDto) {
    return this.financesStatsService.getSupplierDebts(req.user, periodFilterDto);
  }

  /**
   * Methode pour récupérer le compte de résultat (P&L).
   * Exemple d'url: /finances-stats/pnl-statement?period=THIS_MONTH
   */
  @Get('pnl-statement')
  getPnlStatement(@Req() req: any, @Query() periodFilterDto: PeriodFilterDto) {
    return this.financesStatsService.getPnlStatement(req.user, periodFilterDto);
  }

  /**
   * Methode pour récupérer le bilan comptable.
   * Exemple d'url: /finances-stats/balance-sheet
   */
  @Get('balance-sheet')
  getBalanceSheet(@Req() req: any) {
    return this.financesStatsService.getBalanceSheet(req.user);
  }

  /**
   * Methode pour récupérer l'analyse CRM.
   * Exemple d'url: /finances-stats/crm-analysis?period=THIS_MONTH
   */
  @Get('crm-analysis')
  @Roles(UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR, UserRole.COMMERCIAL)
  getCrmAnalysis(@Req() req: any, @Query() periodFilterDto: PeriodFilterDto) {
    return this.financesStatsService.getCrmAnalysis(req.user, periodFilterDto);
  }
}
