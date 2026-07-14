import { Controller, Get, Query, Req, UseGuards, SetMetadata } from '@nestjs/common';
import { IncomestatementService } from './incomestatement.service';
import { IncomeStatementDto } from './dto/income-statement.dto';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';
import { RoleGuard } from '../../common/auth/role/role.guard';
import { Roles } from '../../common/auth/role/role.decorator';
import { UserRole } from '@prisma/client';
import { resolveEffectiveSubsidiaryId, resolveScopeContext, ScopableUser } from '../../common/utils/subsidiary-scope';

@Controller('finances-stats')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles(UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR, UserRole.SUPER_ADMIN)
export class IncomestatementController {
  constructor(private readonly incomestatementService: IncomestatementService) {}

  /**
   * Resout la filiale effective a interroger: un utilisateur sans scope
   * global (SUPER_ADMIN/FINANCIAL_DIRECTOR consolide) est TOUJOURS force sur
   * sa propre filiale, meme s'il fournit ?subsidiaryId=<autre-filiale>.
   */
  private resolveSubsidiaryId(req: { user: ScopableUser }, requestedSubsidiaryId?: string): string | undefined {
    const ctx = resolveScopeContext(req.user, [UserRole.FINANCIAL_DIRECTOR]);
    return resolveEffectiveSubsidiaryId(ctx, requestedSubsidiaryId);
  }

  /**
   * Endpoint principal pour récupérer le compte de résultat (P&L)
   * GET /finances-stats/pnl-statement?subsidiaryId=xxx&startDate=xxx&endDate=xxx
   */
  @Get('pnl-statement')
  async getIncomeStatement(
    @Req() req: { user: ScopableUser },
    @Query('subsidiaryId') subsidiaryId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<IncomeStatementDto> {
    return this.incomestatementService.getIncomeStatement(this.resolveSubsidiaryId(req, subsidiaryId), startDate, endDate);
  }

  /**
   * Endpoint pour récupérer les revenus
   * GET /finances-stats/revenue?subsidiaryId=xxx&startDate=xxx&endDate=xxx
   */
  @Get('revenue')
  async getRevenue(
    @Req() req: { user: ScopableUser },
    @Query('subsidiaryId') subsidiaryId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<number> {
    return this.incomestatementService.getRevenueData(this.resolveSubsidiaryId(req, subsidiaryId), startDate, endDate);
  }

  /**
   * Endpoint pour récupérer le COGS
   * GET /finances-stats/cogs?subsidiaryId=xxx&startDate=xxx&endDate=xxx
   */
  @Get('cogs')
  async getCogs(
    @Req() req: { user: ScopableUser },
    @Query('subsidiaryId') subsidiaryId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<number> {
    return this.incomestatementService.getCogsData(this.resolveSubsidiaryId(req, subsidiaryId), startDate, endDate);
  }

  /**
   * Endpoint pour récupérer les dépenses d'exploitation
   * GET /finances-stats/operating-expenses?subsidiaryId=xxx&startDate=xxx&endDate=xxx
   */
  @Get('operating-expenses')
  async getOperatingExpenses(
    @Req() req: { user: ScopableUser },
    @Query('subsidiaryId') subsidiaryId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<number> {
    return this.incomestatementService.getOperatingExpensesData(this.resolveSubsidiaryId(req, subsidiaryId), startDate, endDate);
  }

  /**
   * Endpoint pour récupérer les taxes
   * GET /finances-stats/taxes?subsidiaryId=xxx&startDate=xxx&endDate=xxx
   */
  @Get('taxes')
  async getTaxes(
    @Req() req: { user: ScopableUser },
    @Query('subsidiaryId') subsidiaryId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<number> {
    return this.incomestatementService.getTaxesData(this.resolveSubsidiaryId(req, subsidiaryId), startDate, endDate);
  }
}
