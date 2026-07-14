import { Controller, Get, Query, UseGuards, SetMetadata, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { PeriodFilterDto } from './dto/period-filter.dto';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { RoleGuard } from 'src/common/auth/role/role.guard';
import { UserRole } from '@prisma/client';


@Controller('analytics')
@UseGuards(JwtAuthGuard, RoleGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Methode pour récupérer les statistiques du tableau de bord.
   * Exemple d'url: /analytics/dashboard?period=THIS_MONTH&subsidiaryId=xxx (drill-down super-admin)
   */
  @Get('dashboard')
  @SetMetadata('roles', [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR, UserRole.COMMERCIAL, UserRole.SUPER_ADMIN])
  getDashboardStats(@Req() req: any, @Query() periodFilterDto: PeriodFilterDto, @Query('subsidiaryId') subsidiaryId?: string) {
    return this.analyticsService.getDashboardStats(req.user, periodFilterDto, subsidiaryId);
  }

  /**
   * Methode pour récupérer l'analyse des ventes.
   * Exemple d'url: /analytics/sales?period=THIS_MONTH&subsidiaryId=xxx (drill-down super-admin)
   */
  @Get('sales')
  @SetMetadata('roles', [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR, UserRole.COMMERCIAL, UserRole.SUPER_ADMIN])
  getSalesAnalysis(@Req() req: any, @Query() periodFilterDto: PeriodFilterDto, @Query('subsidiaryId') subsidiaryId?: string) {
    return this.analyticsService.getSalesAnalysis(req.user, periodFilterDto, subsidiaryId);
  }

  /**
   * Methode pour récupérer l'analyse des achats.
   * Exemple d'url: /analytics/purchases?period=THIS_MONTH&subsidiaryId=xxx (drill-down super-admin)
   */
  @Get('purchases')
  @SetMetadata('roles', [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR, UserRole.COMMERCIAL, UserRole.SUPER_ADMIN])
  getPurchaseAnalysis(@Req() req: any, @Query() periodFilterDto: PeriodFilterDto, @Query('subsidiaryId') subsidiaryId?: string) {
    return this.analyticsService.getPurchaseAnalysis(req.user, periodFilterDto, subsidiaryId);
  }
}
