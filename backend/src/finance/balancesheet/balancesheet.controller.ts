import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { BalancesheetService } from './balancesheet.service';
import { BalanceSheetDto } from './dto/balance-sheet.dto';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';
import { RoleGuard } from '../../common/auth/role/role.guard';
import { Roles } from '../../common/auth/role/role.decorator';
import { UserRole } from '@prisma/client';
import {
  resolveEffectiveSubsidiaryId,
  resolveScopeContext,
  ScopableUser,
} from '../../common/utils/subsidiary-scope';

@Controller('finances-stats')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles(UserRole.ADMIN, UserRole.FINANCIAL_DIRECTOR, UserRole.SUPER_ADMIN)
export class BalancesheetController {
  constructor(private readonly balancesheetService: BalancesheetService) {}

  /**
   * Resout la filiale effective a interroger: un utilisateur sans scope
   * global (SUPER_ADMIN/FINANCIAL_DIRECTOR consolide) est TOUJOURS force sur
   * sa propre filiale, meme s'il fournit ?subsidiaryId=<autre-filiale> - voir
   * subsidiary-scope.ts pour le detail de la protection anti-IDOR.
   */
  private resolveSubsidiaryId(
    req: { user: ScopableUser },
    requestedSubsidiaryId?: string,
  ): string | undefined {
    const ctx = resolveScopeContext(req.user, [UserRole.FINANCIAL_DIRECTOR]);
    return resolveEffectiveSubsidiaryId(ctx, requestedSubsidiaryId);
  }

  /**
   * Endpoint pour récupérer le bilan comptable
   * GET /finances-stats/balance-sheet?subsidiaryId=xxx
   * Si l'utilisateur a un scope global et n'indique pas subsidiaryId, retourne le bilan consolidé
   */
  @Get('balance-sheet')
  async getBalanceSheet(
    @Req() req: { user: ScopableUser },
    @Query('subsidiaryId') subsidiaryId?: string,
  ): Promise<BalanceSheetDto> {
    return this.balancesheetService.getBalanceSheet(
      this.resolveSubsidiaryId(req, subsidiaryId),
    );
  }

  /**
   * Endpoint pour récupérer les données de trésorerie
   * GET /finances-stats/treasury?subsidiaryId=xxx
   */
  @Get('treasury')
  async getTreasuryData(
    @Req() req: { user: ScopableUser },
    @Query('subsidiaryId') subsidiaryId?: string,
  ): Promise<number> {
    return this.balancesheetService.getTreasuryData(
      this.resolveSubsidiaryId(req, subsidiaryId),
    );
  }

  /**
   * Endpoint pour récupérer les créances clients
   * GET /finances-stats/customer-receivables?subsidiaryId=xxx
   *
   * Réponse enveloppée dans `{ totalReceivables }` pour matcher le contrat
   * attendu par le frontend (Frontend/services/apiStatistic/apiFinanceStats.ts)
   * — avant ce correctif, cette route renvoyait un nombre brut alors que
   * CreditManagement.tsx lisait `response.totalReceivables` (toujours undefined).
   */
  @Get('customer-receivables')
  async getCustomerReceivables(
    @Req() req: { user: ScopableUser },
    @Query('subsidiaryId') subsidiaryId?: string,
  ): Promise<{ totalReceivables: number }> {
    const totalReceivables =
      await this.balancesheetService.getCustomerReceivables(
        this.resolveSubsidiaryId(req, subsidiaryId),
      );
    return { totalReceivables };
  }

  /**
   * Endpoint pour récupérer la valeur des stocks
   * GET /finances-stats/inventory?subsidiaryId=xxx
   */
  @Get('inventory')
  getInventoryValue(): number {
    return this.balancesheetService.getInventoryValue();
  }

  /**
   * Endpoint pour récupérer la valeur des équipements
   * GET /finances-stats/equipments?subsidiaryId=xxx
   */
  @Get('equipments')
  async getEquipmentsValue(
    @Req() req: { user: ScopableUser },
    @Query('subsidiaryId') subsidiaryId?: string,
  ): Promise<number> {
    return this.balancesheetService.getEquipmentsValue(
      this.resolveSubsidiaryId(req, subsidiaryId),
    );
  }

  /**
   * Endpoint pour récupérer la valeur des immobilisations
   * GET /finances-stats/fixed-assets?subsidiaryId=xxx
   */
  @Get('fixed-assets')
  async getFixedAssetsValue(
    @Req() req: { user: ScopableUser },
    @Query('subsidiaryId') subsidiaryId?: string,
  ): Promise<number> {
    return this.balancesheetService.getFixedAssetsValue(
      this.resolveSubsidiaryId(req, subsidiaryId),
    );
  }

  /**
   * Endpoint pour récupérer les dettes fournisseurs
   * GET /finances-stats/supplier-debts?subsidiaryId=xxx
   *
   * Réponse enveloppée dans `{ totalDebts }`, voir le commentaire sur
   * `getCustomerReceivables` ci-dessus pour la raison.
   */
  @Get('supplier-debts')
  async getSupplierDebts(
    @Req() req: { user: ScopableUser },
    @Query('subsidiaryId') subsidiaryId?: string,
  ): Promise<{ totalDebts: number }> {
    const totalDebts = await this.balancesheetService.getSupplierDebts(
      this.resolveSubsidiaryId(req, subsidiaryId),
    );
    return { totalDebts };
  }

  /**
   * Endpoint pour récupérer le capital social
   * GET /finances-stats/share-capital?subsidiaryId=xxx
   */
  @Get('share-capital')
  async getShareCapital(
    @Req() req: { user: ScopableUser },
    @Query('subsidiaryId') subsidiaryId?: string,
  ): Promise<number> {
    return this.balancesheetService.getShareCapital(
      this.resolveSubsidiaryId(req, subsidiaryId),
    );
  }

  /**
   * Endpoint pour récupérer le résultat net cumulé
   * GET /finances-stats/net-income?subsidiaryId=xxx
   */
  @Get('net-income')
  async getAccumulatedNetIncome(
    @Req() req: { user: ScopableUser },
    @Query('subsidiaryId') subsidiaryId?: string,
  ): Promise<number> {
    return this.balancesheetService.getAccumulatedNetIncome(
      this.resolveSubsidiaryId(req, subsidiaryId),
    );
  }
}
