import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { BalanceSheetDto } from './dto/balance-sheet.dto';
import { DebtStatus, OrderStatus, PaymentStatus } from '@prisma/client';
import { AccountingBalanceService } from '../../accounting/shared/accounting-balance.service';

@Injectable()
export class BalancesheetService {
  constructor(
    private prisma: PrismaService,
    private readonly balanceService: AccountingBalanceService,
  ) {}

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
      Promise.resolve(this.getInventoryValue()),
      this.getEquipmentsValue(subsidiaryId),
      this.getFixedAssetsValue(subsidiaryId),
      this.getUnpaidSupplierDebts(subsidiaryId),
      this.getLongTermDebtsBalance(subsidiaryId),
      this.getShareCapital(subsidiaryId),
      this.getRetainedEarnings(subsidiaryId),
    ]);

    const totalAssets =
      treasury + customerReceivables + inventory + equipments + fixedAssets;
    const totalLiabilities = supplierDebts + longTermDebts;
    const totalEquity = shareCapital + retainedEarnings;

    return {
      assets: {
        treasury,
        customerReceivables,
        inventory,
        equipments,
        fixedAssets,
      },
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

  /**
   * Créances clients = solde restant dû (totalAmount - amountPaid) de toute
   * commande non entièrement payée, hors commandes annulées — même logique
   * que CreditManagement.tsx (aucune notion de "compte crédit" séparé à
   * synchroniser, une seule source de vérité : Order.paymentStatus).
   */
  async getCustomerReceivables(subsidiaryId?: string): Promise<number> {
    const orders = await this.prisma.order.findMany({
      where: {
        ...(subsidiaryId ? { subsidiaryId } : {}),
        paymentStatus: { not: PaymentStatus.PAID },
        status: { not: OrderStatus.CANCELLED },
      },
      select: { totalAmount: true, amountPaid: true },
    });

    return orders.reduce(
      (sum, o) => sum + (Number(o.totalAmount) - Number(o.amountPaid)),
      0,
    );
  }

  /**
   * Valorisation des stocks: non applicable car les coûts d'achat ne sont plus stockés sur les produits.
   * Les prix sont maintenant définis uniquement lors de la création des commandes/ventes par le commercial.
   */
  getInventoryValue(): number {
    // Le prix unitaire n'est plus stocké sur l'Item (supprimé du schéma) ;
    // la valeur monétaire du stock est donc estimée à 0 pour le bilan tant
    // qu'aucune valorisation n'est définie (coût moyen pondéré ou autre).
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
   * Valeur nette comptable des immobilisations = solde débiteur cumulé du
   * compte 215/218/211 (acquisitions, comptabilisées via `AssetsService` dès
   * le Phase 3 du module comptabilité) moins le solde du compte 281
   * (amortissements cumulés). Contrairement à l'ancienne approximation
   * (taux annuel × durée de possession appliqué en mémoire), cette valeur
   * vient du grand livre — mais reste "gross" tant que la génération
   * automatique des dotations aux amortissements (Phase 7 — Immobilisations)
   * n'est pas branchée : le compte 281 est alors à 0 et cette méthode
   * retourne le coût d'acquisition cumulé, pas encore net d'amortissement.
   */
  async getFixedAssetsValue(subsidiaryId?: string): Promise<number> {
    const now = new Date();
    const [gross, amortization] = await Promise.all([
      this.balanceService.getAccountBalanceByPrefix(
        ['211', '215', '218'],
        null,
        now,
        subsidiaryId,
      ),
      this.balanceService.getAccountBalance(
        ['281'],
        null,
        now,
        'CREDIT',
        subsidiaryId,
      ),
    ]);
    return gross - Math.abs(amortization);
  }

  /**
   * Uniquement les dettes IMPAYÉES — les dettes payées ne figurent plus au passif.
   */
  async getUnpaidSupplierDebts(subsidiaryId?: string): Promise<number> {
    const debts = await this.prisma.supplierDebt.findMany({
      where: {
        ...(subsidiaryId ? { subsidiaryId } : {}),
        // "amount" est déjà le solde RESTANT (mis à jour à chaque paiement,
        // voir DebtsService.paySupplierDebt) — exclure uniquement PAYER
        // (soldé) couvre aussi bien A_PAYER que PARTIELLEMENT_PAYE, sans
        // sous-évaluer le passif d'une dette partiellement réglée.
        status: { not: DebtStatus.PAYER },
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
    const subs = await this.prisma.subsidiary.findMany({
      select: { shareCapital: true },
    });
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

    const totalRevenue = sales.reduce(
      (sum, s) => sum + Number(s.totalPrice),
      0,
    );
    const totalExpenses = expenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0,
    );
    const totalPayroll = payrolls.reduce(
      (sum, p) => sum + Number(p.netSalary) + Number(p.deductions),
      0,
    );

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
