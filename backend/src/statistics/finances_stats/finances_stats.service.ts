import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import {
  PeriodFilterDto,
  PeriodFilter,
} from '../analytics/dto/period-filter.dto';
import {
  Prisma,
  User,
  OpportunityStage,
  DebtStatus,
} from '@prisma/client';
import {
  sub,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
} from 'date-fns';

@Injectable()
export class FinancesStatsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * @param periodFilterDto Dto de filtre de période
   * @param dateField Champ de date
   * @returns Retourne un filtre de date pour les requêtes Prisma.
   */
  private getDateFilter(
    periodFilterDto: PeriodFilterDto,
    dateField: string,
  ): Record<string, Prisma.DateTimeFilter> {
    const { period, startDate, endDate } = periodFilterDto;
    const now = new Date();
    let dateFilter: Prisma.DateTimeFilter = {};

    switch (period) {
      case PeriodFilter.THIS_MONTH:
        dateFilter = { gte: startOfMonth(now), lte: endOfMonth(now) };
        break;
      case PeriodFilter.LAST_MONTH:
        const lastMonth = subMonths(now, 1);
        dateFilter = {
          gte: startOfMonth(lastMonth),
          lte: endOfMonth(lastMonth),
        };
        break;
      case PeriodFilter.LAST_7_DAYS:
        dateFilter = { gte: sub(now, { days: 7 }) };
        break;
      case PeriodFilter.LAST_30_DAYS:
        dateFilter = { gte: sub(now, { days: 30 }) };
        break;
      case PeriodFilter.LAST_90_DAYS:
        dateFilter = { gte: sub(now, { days: 90 }) };
        break;
      case PeriodFilter.THIS_YEAR:
        dateFilter = { gte: startOfYear(now), lte: endOfYear(now) };
        break;
      case PeriodFilter.CUSTOM:
        if (!startDate || !endDate) {
          throw new BadRequestException(
            'Pour une période personnalisée, les dates de début et de fin sont requises.',
          );
        }
        dateFilter = { gte: new Date(startDate), lte: new Date(endDate) };
        break;
      case PeriodFilter.ALL_TIME:
      default:
        return {};
    }
    return { [dateField]: dateFilter };
  }

  /**
   * @param user Utilisateur
   * @param periodFilterDto Dto de filtre de période
   * @returns Retourne le solde des créances clients.
   */
  async getCustomerReceivables(user: User, periodFilterDto: PeriodFilterDto) {
    const { subsidiaryId } = user;
    // Le filtre de date s'applique à la date de la commande.
    const dateFilter = this.getDateFilter(periodFilterDto, 'date');

    // Calculer les créances clients à partir des commandes impayées et partiellement payées
    const orders = await this.prisma.order.findMany({
      where: {
        subsidiaryId,
        OR: [{ paymentStatus: 'UNPAID' }, { paymentStatus: 'PARTIALLY_PAID' }],
        ...dateFilter,
      },
      select: {
        totalAmount: true,
        amountPaid: true,
      },
    });

    // Calculer le solde total dû (totalAmount - amountPaid)
    const totalReceivables = orders.reduce((sum, order) => {
      const balance = order.totalAmount.sub(order.amountPaid);
      return sum.add(balance);
    }, new Prisma.Decimal(0));

    return {
      totalReceivables: totalReceivables.toNumber(),
    };
  }

  /**
   * @param user Utilisateur
   * @param periodFilterDto Dto de filtre de période
   * @returns Retourne le solde des dettes fournisseurs.
   */
  async getSupplierDebts(user: User, periodFilterDto: PeriodFilterDto) {
    const { subsidiaryId } = user;
    const dateFilter = this.getDateFilter(periodFilterDto, 'dueDate');

    const result = await this.prisma.supplierDebt.aggregate({
      _sum: { amount: true },
      where: {
        subsidiaryId,
        status: { not: DebtStatus.PAYER },
        ...dateFilter,
      },
    });

    return {
      totalDebts: result._sum.amount?.toNumber() ?? 0,
    };
  }

  /**
   * @param user Utilisateur
   * @param periodFilterDto Dto de filtre de période
   * @returns Retourne le compte de résultat (P&L).
   */
  async getPnlStatement(user: User, periodFilterDto: PeriodFilterDto) {
    const { subsidiaryId } = user;
    const dateFilter = this.getDateFilter(periodFilterDto, 'saleDate');

    // Chiffre d'affaires
    const salesResult = await this.prisma.sale.aggregate({
      _sum: { totalPrice: true },
      where: { subsidiaryId, status: 'PAID', ...dateFilter },
    });
    const revenue = salesResult._sum.totalPrice ?? new Prisma.Decimal(0);

    // Coût des marchandises vendues (CMV)
    const salesWithItems = await this.prisma.sale.findMany({
      where: {
        subsidiaryId,
        status: 'PAID',
        orderId: { not: null },
        ...dateFilter,
      },
      include: {
        order: { include: { orderItems: { include: { product: true } } } },
      },
    });

    let cogs = new Prisma.Decimal(0);
    for (const sale of salesWithItems) {
      if (sale.order) {
        for (const item of sale.order.orderItems) {
          if (item.product?.price) {
            cogs = cogs.add(item.product.price.mul(item.quantity));
          }
        }
      }
    }

    // Charges d'exploitation
    const expensesResult = await this.prisma.expenseRecord.aggregate({
      _sum: { amount: true },
      where: {
        subsidiaryId,
        ...this.getDateFilter(periodFilterDto, 'expenseDate'),
      },
    });
    const operatingExpenses =
      expensesResult._sum.amount ?? new Prisma.Decimal(0);

    const grossProfit = revenue.sub(cogs);
    const taxRate = 0.3; // 30%
    const taxes = grossProfit.gt(0)
      ? grossProfit.mul(taxRate)
      : new Prisma.Decimal(0);
    const netIncome = grossProfit.sub(operatingExpenses).sub(taxes);

    return {
      revenue: revenue.toNumber(),
      cogs: cogs.toNumber(),
      grossProfit: grossProfit.toNumber(),
      operatingExpenses: operatingExpenses.toNumber(),
      taxes: taxes.toNumber(),
      netIncome: netIncome.toNumber(),
    };
  }

  /**
   * @param user Utilisateur
   * @returns Retourne le bilan comptable.
   */
  async getBalanceSheet(user: User) {
    const { subsidiaryId } = user;

    const [
      treasury,
      receivables,
      inventoryValue,
      fixedAssets,
      equipments,
      supplierDebts,
      subsidiary,
      pnl,
    ] = await Promise.all([
      this.prisma.treasuryAccount.aggregate({
        _sum: { balance: true },
        where: { subsidiaryId },
      }),
      this.getCustomerReceivables(user, { period: PeriodFilter.ALL_TIME }),
      this.prisma.itemStock.findMany({
        where: { subsidiaryId, stock: { gt: 0 } },
        select: { stock: true, item: { select: { price: true } } },
      }),
      this.prisma.fixedAsset.aggregate({
        _sum: { acquisitionCost: true },
        where: { subsidiaryId },
      }),
      this.prisma.equipment.aggregate({
        _sum: { acquisitionValue: true },
        where: { subsidiaryId },
      }),
      this.getSupplierDebts(user, { period: PeriodFilter.ALL_TIME }),
      this.prisma.subsidiary.findUnique({ where: { id: subsidiaryId } }),
      this.getPnlStatement(user, { period: PeriodFilter.THIS_YEAR }), // Résultat de l'exercice en cours
    ]);

    const inventory = inventoryValue.reduce(
      (acc, s) => acc.add((s.item.price ?? new Prisma.Decimal(0)).mul(s.stock)),
      new Prisma.Decimal(0),
    );

    const assets = {
      treasury: treasury._sum.balance?.toNumber() ?? 0,
      customerReceivables: receivables.totalReceivables,
      inventory: inventory.toNumber(),
      equipments: equipments._sum.acquisitionValue?.toNumber() ?? 0,
      fixedAssets: fixedAssets._sum.acquisitionCost?.toNumber() ?? 0,
    };
    const totalAssets = Object.values(assets).reduce(
      (sum, val) => sum + val,
      0,
    );

    const liabilities = {
      supplierDebts: supplierDebts.totalDebts,
      shareCapital: subsidiary?.shareCapital.toNumber() ?? 0,
      netIncome: pnl.netIncome,
    };
    const totalLiabilities = Object.values(liabilities).reduce(
      (sum, val) => sum + val,
      0,
    );

    return { assets, totalAssets, liabilities, totalLiabilities };
  }

  /**
   * @param user Utilisateur
   * @param periodFilterDto Dto de filtre de période
   * @returns Retourne l'analyse CRM.
   */
  async getCrmAnalysis(user: User, periodFilterDto: PeriodFilterDto) {
    const { subsidiaryId } = user;
    const dateFilter = this.getDateFilter(periodFilterDto, 'closeDate');

    const opportunities = await this.prisma.opportunity.findMany({
      where: { subsidiaryId, ...dateFilter },
    });

    const pipelineValue = opportunities
      .filter(
        (o) =>
          o.stage !== OpportunityStage.WON && o.stage !== OpportunityStage.LOST,
      )
      .reduce((sum, o) => sum.add(o.opportunityValue), new Prisma.Decimal(0));

    const wonCount = opportunities.filter(
      (o) => o.stage === OpportunityStage.WON,
    ).length;
    const totalCount = opportunities.length;
    const conversionRate = totalCount > 0 ? (wonCount / totalCount) * 100 : 0;

    const newOpportunities = opportunities.length;
    const webOpportunities = opportunities.filter(
      (o) => o.sourceOpportunity === 'WEB_ORDER',
    ).length;

    return {
      pipelineValue: pipelineValue.toNumber(),
      conversionRate,
      newOpportunities,
      webOpportunities,
    };
  }
}
