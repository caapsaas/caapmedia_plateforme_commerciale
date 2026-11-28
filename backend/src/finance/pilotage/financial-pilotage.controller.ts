import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';
import {
  ActiveRoles,
  CurrentUser,
} from '../../common/auth/role/role.decorator';
import type { JwtUser } from '../../common/auth/jwt/jwt-user.interface';
import {
  resolveEffectiveSubsidiaryId,
  resolveScopeContext,
} from '../../common/utils/subsidiary-scope';
import { FinancialPilotageService } from './financial-pilotage.service';

@ApiTags('Financial Pilotage')
@UseGuards(JwtAuthGuard)
@Controller('finances-stats')
export class FinancialPilotageController {
  constructor(private readonly pilotageService: FinancialPilotageService) {}

  @Get('cashflow')
  @ActiveRoles(
    UserRole.ADMIN,
    UserRole.FINANCIAL_DIRECTOR,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({
    summary: 'Tableau de pilotage Cash-Flow (trésorerie réelle & encours)',
  })
  @ApiQuery({ name: 'subsidiaryId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getCashflowReport(
    @CurrentUser() user: JwtUser,
    @Query('subsidiaryId') subsidiaryId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.pilotageService.getCashflowReport(
      resolveEffectiveSubsidiaryId(resolveScopeContext(user), subsidiaryId),
      startDate,
      endDate,
    );
  }

  @Get('profitability')
  @ActiveRoles(
    UserRole.ADMIN,
    UserRole.FINANCIAL_DIRECTOR,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({
    summary:
      'Analyse de rentabilité opérationnelle (marge, taux de recouvrement)',
  })
  @ApiQuery({ name: 'subsidiaryId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getProfitabilityReport(
    @CurrentUser() user: JwtUser,
    @Query('subsidiaryId') subsidiaryId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.pilotageService.getProfitabilityReport(
      resolveEffectiveSubsidiaryId(resolveScopeContext(user), subsidiaryId),
      startDate,
      endDate,
    );
  }

  @Get('customer-receivables')
  @ActiveRoles(
    UserRole.ADMIN,
    UserRole.FINANCIAL_DIRECTOR,
    UserRole.SUPER_ADMIN,
  )
  getCustomerReceivables(
    @CurrentUser() user: JwtUser,
    @Query('subsidiaryId') subsidiaryId?: string,
  ) {
    return this.pilotageService.getCustomerReceivables(
      resolveEffectiveSubsidiaryId(resolveScopeContext(user), subsidiaryId),
    );
  }

  @Get('supplier-debts')
  @ActiveRoles(
    UserRole.ADMIN,
    UserRole.FINANCIAL_DIRECTOR,
    UserRole.SUPER_ADMIN,
  )
  getSupplierDebts(
    @CurrentUser() user: JwtUser,
    @Query('subsidiaryId') subsidiaryId?: string,
  ) {
    return this.pilotageService.getUnpaidSupplierDebts(
      resolveEffectiveSubsidiaryId(resolveScopeContext(user), subsidiaryId),
    );
  }

  @Get('treasury')
  @ActiveRoles(
    UserRole.ADMIN,
    UserRole.FINANCIAL_DIRECTOR,
    UserRole.SUPER_ADMIN,
  )
  getTreasury(
    @CurrentUser() user: JwtUser,
    @Query('subsidiaryId') subsidiaryId?: string,
  ) {
    return this.pilotageService.getTreasuryData(
      resolveEffectiveSubsidiaryId(resolveScopeContext(user), subsidiaryId),
    );
  }
}
