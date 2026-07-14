import { Controller, Get, Query, UseGuards, SetMetadata } from '@nestjs/common';
import { BalancesheetService } from './balancesheet.service';
import { BalanceSheetDto } from './dto/balance-sheet.dto';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';
import { RoleGuard } from '../../common/auth/role/role.guard';
import { UserRole } from '@prisma/client';

@Controller('finances-stats')
@UseGuards(JwtAuthGuard, RoleGuard)
@SetMetadata('roles', [UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR])
export class BalancesheetController {
  constructor(private readonly balancesheetService: BalancesheetService) {}

  /**
   * Endpoint pour récupérer le bilan comptable
   * GET /finances-stats/balance-sheet?subsidiaryId=xxx
   * Si subsidiaryId n'est pas fourni, retourne le bilan consolidé
   */
  @Get('balance-sheet')
  async getBalanceSheet(@Query('subsidiaryId') subsidiaryId?: string): Promise<BalanceSheetDto> {
    return this.balancesheetService.getBalanceSheet(subsidiaryId);
  }

  /**
   * Endpoint pour récupérer les données de trésorerie
   * GET /finances-stats/treasury?subsidiaryId=xxx
   */
  @Get('treasury')
  async getTreasuryData(@Query('subsidiaryId') subsidiaryId?: string): Promise<number> {
    return this.balancesheetService.getTreasuryData(subsidiaryId);
  }

  /**
   * Endpoint pour récupérer les créances clients
   * GET /finances-stats/customer-receivables?subsidiaryId=xxx
   */
  @Get('customer-receivables')
  async getCustomerReceivables(@Query('subsidiaryId') subsidiaryId?: string): Promise<number> {
    return this.balancesheetService.getCustomerReceivables(subsidiaryId);
  }

  /**
   * Endpoint pour récupérer la valeur des stocks
   * GET /finances-stats/inventory?subsidiaryId=xxx
   */
  @Get('inventory')
  async getInventoryValue(@Query('subsidiaryId') subsidiaryId?: string): Promise<number> {
    return this.balancesheetService.getInventoryValue(subsidiaryId);
  }

  /**
   * Endpoint pour récupérer la valeur des équipements
   * GET /finances-stats/equipments?subsidiaryId=xxx
   */
  @Get('equipments')
  async getEquipmentsValue(@Query('subsidiaryId') subsidiaryId?: string): Promise<number> {
    return this.balancesheetService.getEquipmentsValue(subsidiaryId);
  }

  /**
   * Endpoint pour récupérer la valeur des immobilisations
   * GET /finances-stats/fixed-assets?subsidiaryId=xxx
   */
  @Get('fixed-assets')
  async getFixedAssetsValue(@Query('subsidiaryId') subsidiaryId?: string): Promise<number> {
    return this.balancesheetService.getFixedAssetsValue(subsidiaryId);
  }

  /**
   * Endpoint pour récupérer les dettes fournisseurs
   * GET /finances-stats/supplier-debts?subsidiaryId=xxx
   */
  @Get('supplier-debts')
  async getSupplierDebts(@Query('subsidiaryId') subsidiaryId?: string): Promise<number> {
    return this.balancesheetService.getSupplierDebts(subsidiaryId);
  }

  /**
   * Endpoint pour récupérer le capital social
   * GET /finances-stats/share-capital?subsidiaryId=xxx
   */
  @Get('share-capital')
  async getShareCapital(@Query('subsidiaryId') subsidiaryId?: string): Promise<number> {
    return this.balancesheetService.getShareCapital(subsidiaryId);
  }

  /**
   * Endpoint pour récupérer le résultat net cumulé
   * GET /finances-stats/net-income?subsidiaryId=xxx
   */
  @Get('net-income')
  async getAccumulatedNetIncome(@Query('subsidiaryId') subsidiaryId?: string): Promise<number> {
    return this.balancesheetService.getAccumulatedNetIncome(subsidiaryId);
  }
}
