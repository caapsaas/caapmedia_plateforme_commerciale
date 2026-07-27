import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { IncomeStatementDto } from './dto/income-statement.dto';

@Injectable()
export class IncomestatementService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calcule le compte de résultat sur une période donnée.
   * - Le filtre de date utilise saleDate / expenseDate (dates métier) et non createdAt.
   * - Seules les ventes PAID comptent comme revenus réalisés.
   * - Les taxes sont calculées à partir du taxRate réel de chaque vente.
   * - Le COGS utilise product.price (coût d'achat) et non sellingPrice.
   */
  async getIncomeStatement(
    subsidiaryId?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<IncomeStatementDto> {
    const [revenue, cogs, taxes, operatingExpenses] = await Promise.all([
      this.getRevenue(subsidiaryId, startDate, endDate),
      this.getCostOfGoodsSold(subsidiaryId, startDate, endDate),
      this.getTaxes(subsidiaryId, startDate, endDate),
      this.getOperatingExpenses(subsidiaryId, startDate, endDate),
    ]);

    const grossProfit = revenue - cogs;
    const netIncome = grossProfit - operatingExpenses - taxes;

    return { revenue, cogs, grossProfit, operatingExpenses, taxes, netIncome };
  }

  private async getRevenue(
    subsidiaryId?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<number> {
    const sales = await this.prisma.sale.findMany({
      where: {
        ...(subsidiaryId ? { subsidiaryId } : {}),
        status: 'PAID', // Uniquement les ventes encaissées
        saleDate: this.buildDateRange(startDate, endDate), // Filtre sur la date métier
      },
      select: { totalPrice: true },
    });
    return sales.reduce((sum, s) => sum + Number(s.totalPrice), 0);
  }

  /**
   * COGS: non applicable car les coûts d'achat ne sont plus stockés sur les produits.
   * Le champ `price` a été supprimé du schéma — retourne 0.
   */
  private async getCostOfGoodsSold(
    _subsidiaryId?: string,
    _startDate?: string,
    _endDate?: string,
  ): Promise<number> {
    return 0;
  }

  private async getOperatingExpenses(
    subsidiaryId?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<number> {
    const where = {
      ...(subsidiaryId ? { subsidiaryId } : {}),
    };

    const [expenses, payrolls] = await Promise.all([
      this.prisma.expenseRecord.findMany({
        where: {
          ...where,
          expenseDate: this.buildDateRange(startDate, endDate),
        },
        select: { amount: true },
      }),
      this.prisma.payrollRecord.findMany({
        where,
        select: { netSalary: true, deductions: true },
      }),
    ]);

    const totalExpenses = expenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0,
    );
    const totalPayroll = payrolls.reduce(
      (sum, p) => sum + Number(p.netSalary) + Number(p.deductions),
      0,
    );

    return totalExpenses + totalPayroll;
  }

  /**
   * Taxes calculées à partir du taxRate réel de chaque vente, pas un taux fixe hardcodé.
   * taxAmount = totalPrice * (taxRate / 100)
   */
  private async getTaxes(
    subsidiaryId?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<number> {
    const sales = await this.prisma.sale.findMany({
      where: {
        ...(subsidiaryId ? { subsidiaryId } : {}),
        status: 'PAID',
        saleDate: this.buildDateRange(startDate, endDate),
      },
      select: { totalPrice: true, taxRate: true },
    });

    return sales.reduce(
      (sum, s) => sum + Number(s.totalPrice) * (Number(s.taxRate) / 100),
      0,
    );
  }

  /**
   * Construit un filtre de plage de dates pour les champs DateTime Prisma.
   * Retourne undefined si aucune date n'est fournie (pas de filtre).
   */
  private buildDateRange(
    startDate?: string,
    endDate?: string,
  ): { gte?: Date; lte?: Date } | undefined {
    if (!startDate && !endDate) return undefined;

    const range: { gte?: Date; lte?: Date } = {};
    if (startDate) range.gte = new Date(startDate);
    if (endDate) range.lte = new Date(endDate);
    return range;
  }

  // Méthodes publiques pour les endpoints individuels
  async getRevenueData(
    subsidiaryId?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<number> {
    return this.getRevenue(subsidiaryId, startDate, endDate);
  }

  async getCogsData(
    subsidiaryId?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<number> {
    return this.getCostOfGoodsSold(subsidiaryId, startDate, endDate);
  }

  async getOperatingExpensesData(
    subsidiaryId?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<number> {
    return this.getOperatingExpenses(subsidiaryId, startDate, endDate);
  }

  async getTaxesData(
    subsidiaryId?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<number> {
    return this.getTaxes(subsidiaryId, startDate, endDate);
  }
}
