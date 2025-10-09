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

  @Get('dashboard')
  @SetMetadata('roles', [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR, UserRole.COMMERCIAL])
  getDashboardStats(@Req() req: any, @Query() periodFilterDto: PeriodFilterDto) {
    return this.analyticsService.getDashboardStats(req.user, periodFilterDto);
  }

  @Get('sales')
  @SetMetadata('roles', [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR, UserRole.COMMERCIAL])
  getSalesAnalysis(@Req() req: any, @Query() periodFilterDto: PeriodFilterDto) {
    return this.analyticsService.getSalesAnalysis(req.user, periodFilterDto);
  }

  @Get('purchases')
  @SetMetadata('roles', [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR, UserRole.COMMERCIAL])
  getPurchaseAnalysis(@Req() req: any, @Query() periodFilterDto: PeriodFilterDto) {
    return this.analyticsService.getPurchaseAnalysis(req.user, periodFilterDto);
  }
}
