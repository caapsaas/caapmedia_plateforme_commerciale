import { Controller, Get, Query, UseGuards, SetMetadata } from '@nestjs/common';
import { IncomestatementService } from './incomestatement.service';
import { IncomeStatementDto } from './dto/income-statement.dto';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';
import { RoleGuard } from '../../common/auth/role/role.guard';
import { UserRole } from '@prisma/client';

@Controller('finances-stats')
@UseGuards(JwtAuthGuard, RoleGuard)
@SetMetadata('roles', [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR])
export class IncomestatementController {
  constructor(private readonly incomestatementService: IncomestatementService) {}

  /**
   * Endpoint principal pour récupérer le compte de résultat (P&L)
   * GET /finances-stats/pnl-statement?subsidiaryId=xxx&startDate=xxx&endDate=xxx
   */
  @Get('pnl-statement')
  async getIncomeStatement(
    @Query('subsidiaryId') subsidiaryId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<IncomeStatementDto> {
    return this.incomestatementService.getIncomeStatement(subsidiaryId, startDate, endDate);
  }

  /**
   * Endpoint pour récupérer les revenus
   * GET /finances-stats/revenue?subsidiaryId=xxx&startDate=xxx&endDate=xxx
   */
  @Get('revenue')
  async getRevenue(
    @Query('subsidiaryId') subsidiaryId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<number> {
    return this.incomestatementService.getRevenueData(subsidiaryId, startDate, endDate);
  }

  /**
   * Endpoint pour récupérer le COGS
   * GET /finances-stats/cogs?subsidiaryId=xxx&startDate=xxx&endDate=xxx
   */
  @Get('cogs')
  async getCogs(
    @Query('subsidiaryId') subsidiaryId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<number> {
    return this.incomestatementService.getCogsData(subsidiaryId, startDate, endDate);
  }

  /**
   * Endpoint pour récupérer les dépenses d'exploitation
   * GET /finances-stats/operating-expenses?subsidiaryId=xxx&startDate=xxx&endDate=xxx
   */
  @Get('operating-expenses')
  async getOperatingExpenses(
    @Query('subsidiaryId') subsidiaryId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<number> {
    return this.incomestatementService.getOperatingExpensesData(subsidiaryId, startDate, endDate);
  }

  /**
   * Endpoint pour récupérer les taxes
   * GET /finances-stats/taxes?subsidiaryId=xxx&startDate=xxx&endDate=xxx
   */
  @Get('taxes')
  async getTaxes(
    @Query('subsidiaryId') subsidiaryId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<number> {
    return this.incomestatementService.getTaxesData(subsidiaryId, startDate, endDate);
  }
}
