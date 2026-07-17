import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { BalanceSheetDto } from './dto/balance-sheet.dto';
import { DebtStatus } from '@prisma/client';

@Injectable()
export class BalancesheetService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calcule le bilan comptable : Actifs = Passifs + Capitaux propres
   * Les capitaux propres (equity) sont distincts des passifs (liabilities).
   */
  async getBalanceSheet(subsidiaryId?: string): Promise<BalanceSheetDto> {
    const [
      treasury,
      customerReceivables,
      inventory,
      equipments,
      fixedAssets,
      supplierDebts,
      longTermDebts,
      shareCapital,
      retainedEarnings,
    ] = await Promise.all([
      this.getTreasuryData(subsidiaryId),
      this.getCustomerReceivables(subsidiaryId),
      this.getInventoryValue(subsidiaryId),
      this.getEquipmentsValue(subsidiaryId),
      this.getFixedAssetsValue(subsidiaryId),
      this.getUnpaidSupplierDebts(subsidiaryId),
      this.getLongTermDebtsBalance(subsidiaryId),
      this.getShareCapital(subsidiaryId),
      this.getRetainedEarnings(subsidiaryId),
    ]);

    const totalAssets = treasury + customerReceivables + inventory + equipments + fixedAssets;
    const totalLiabilities = supplierDebts + longTermDebts;
    const totalEquity = shareCapital + retainedEarnings;

    return {
      assets: { treasury, customerReceivables, inventory, equipments, fixedAssets },
      totalAssets,
      liabilities: { supplierDebts, longTermDebts },
      totalLiabilities,
      equity: { shareCapital, retainedEarnings },
      totalEquity,
    };
  }

  async getTreasuryData(subsidiaryId?: string): Promise<number> {
    const accounts = await this.prisma.treasuryAccount.findMany({
      where: subsidiaryId ? { subsidiaryId } : {},
      select: { balance: true },
    });
    return accounts.reduce((sum, a) => sum + Number(a.balance), 0);
  }

  async getCustomerReceivables(subsidiaryId?: string): Promise<number> {
    const [creditAccounts, pendingSales] = await Promise.all([
      this.prisma.creditAccount.findMany({
        where: subsidiaryId ? { subsidiaryId } : {},
        select: { balance: true },
      }),
      this.prisma.sale.findMany({
        where: {
          ...(subsidiaryId ? { subsidiaryId } : {}),
          status: 'PENDING',
        },
        select: { totalPrice: true },
      }),
    ]);

    const creditTotal = creditAccounts.reduce((sum, a) => sum + Number(a.balance), 0);
    const pendingTotal = pendingSales.reduce((sum, s) => sum + Number(s.totalPrice), 0);
    return creditTotal + pendingTotal;
  }

  /**
   * Valorisation des stocks: non applicable car les coûts d'achat ne sont plus stockés sur les produits.
   * Les prix sont maintenant définis uniquement lors de la création des commandes/ventes par le commercial.
   */
  async getInventoryValue(subsidiaryId?: string): Promise<number> {
    return 0;
  }

  async getEquipmentsValue(subsidiaryId?: string): Promise<number> {
    const equipments = await this.prisma.equipment.findMany({
      where: subsidiaryId ? { subsidiaryId } : {},
      select: { acquisitionValue: true },
    });
    return equipments.reduce((sum, e) => sum + Number(e.acquisitionValue), 0);
  }

  /**
   * Valeur nette comptable : coût d'acquisition moins amortissement cumulé.
   * Pour le calcul correct, l'amortissement devrait être calculé sur la durée de vie.
   * Ici on applique le taux annuel sur le coût d'acquisition comme approximation.
   */
  async getFixedAssetsValue(subsidiaryId?: string): Promise<number> {
    const assets = await this.prisma.fixedAsset.findMany({
      where: subsidiaryId ? { subsidiaryId } : {},
      select: { acquisitionCost: true, depreciationRate: true, acquisitionDate: true },
    });

    const now = new Date();
    return assets.reduce((sum, asset) => {
      const cost = Number(asset.acquisitionCost);
      const rate = Number(asset.depreciationRate) / 100;
      const yearsOwned = (now.getTime() - new Date(asset.acquisitionDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
      const totalDepreciation = Math.min(cost * rate * yearsOwned, cost);
      return sum + (cost - totalDepreciation);
    }, 0);
  }

  /**
   * Uniquement les dettes IMPAYÉES — les dettes payées ne figurent plus au passif.
   */
  async getUnpaidSupplierDebts(subsidiaryId?: string): Promise<number> {
    const debts = await this.prisma.supplierDebt.findMany({
      where: {
        ...(subsidiaryId ? { subsidiaryId } : {}),
        status: DebtStatus.A_PAYER,
      },
      select: { amount: true },
    });
    return debts.reduce((sum, d) => sum + Number(d.amount), 0);
  }

  async getLongTermDebtsBalance(subsidiaryId?: string): Promise<number> {
    const debts = await this.prisma.longTermDebt.findMany({
      where: subsidiaryId ? { subsidiaryId } : {},
      select: { currentBalance: true },
    });
    return debts.reduce((sum, d) => sum + Number(d.currentBalance), 0);
  }

  async getShareCapital(subsidiaryId?: string): Promise<number> {
    if (subsidiaryId) {
      const sub = await this.prisma.subsidiary.findUnique({
        where: { id: subsidiaryId },
        select: { shareCapital: true },
      });
      return Number(sub?.shareCapital) || 0;
    }
    const subs = await this.prisma.subsidiary.findMany({ select: { shareCapital: true } });
    return subs.reduce((sum, s) => sum + Number(s.shareCapital), 0);
  }

  /**
   * Résultats cumulés (bénéfices non distribués) = revenus encaissés - dépenses - masse salariale.
   * Seules les ventes PAYÉES comptent comme revenus réalisés.
   */
  async getRetainedEarnings(subsidiaryId?: string): Promise<number> {
    const where = subsidiaryId ? { subsidiaryId } : {};

    const [sales, expenses, payrolls] = await Promise.all([
      this.prisma.sale.findMany({
        where: { ...where, status: 'PAID' },
        select: { totalPrice: true },
      }),
      this.prisma.expenseRecord.findMany({
        where,
        select: { amount: true },
      }),
      this.prisma.payrollRecord.findMany({
        where,
        select: { netSalary: true, deductions: true },
      }),
    ]);

    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.totalPrice), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalPayroll = payrolls.reduce((sum, p) => sum + Number(p.netSalary) + Number(p.deductions), 0);

    return totalRevenue - totalExpenses - totalPayroll;
  }

  // Méthodes publiques pour les endpoints individuels du controller
  async getSupplierDebts(subsidiaryId?: string): Promise<number> {
    return this.getUnpaidSupplierDebts(subsidiaryId);
  }

  async getAccumulatedNetIncome(subsidiaryId?: string): Promise<number> {
    return this.getRetainedEarnings(subsidiaryId);
  }
}
