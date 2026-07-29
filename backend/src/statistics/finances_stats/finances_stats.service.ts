import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import {
  PeriodFilterDto,
  PeriodFilter,
} from '../analytics/dto/period-filter.dto';
import { Prisma, User, OpportunityStage } from '@prisma/client';
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
   * @returns Retourne le compte de résultat (P&L).
   */
  async getPnlStatement(user: User, periodFilterDto: PeriodFilterDto) {
    const { subsidiaryId } = user;
    const dateFilter = this.getDateFilter(periodFilterDto, 'saleDate');

    // Récupérer le taux d'impôt de la filiale
    const subsidiary = await this.prisma.subsidiary.findUnique({
      where: { id: subsidiaryId },
      select: { taxRate: true },
    });
    const taxRate = subsidiary?.taxRate ?? new Prisma.Decimal(0.3); // Défaut 30% si non configuré

    // Chiffre d'affaires
    const salesResult = await this.prisma.sale.aggregate({
      _sum: { totalPrice: true },
      where: { subsidiaryId, status: 'PAID', ...dateFilter },
    });
    const revenue = salesResult._sum.totalPrice ?? new Prisma.Decimal(0);

    // Coût des marchandises vendues (CMV) — non calculable : price supprimé du schéma Item.
    const cogs = new Prisma.Decimal(0);

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

    // Calculs du P&L selon SYSCOHADA
    const grossProfit = revenue.sub(cogs);
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
