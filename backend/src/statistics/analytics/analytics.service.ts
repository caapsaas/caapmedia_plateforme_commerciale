import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { PeriodFilterDto, PeriodFilter } from './dto/period-filter.dto';
import { Prisma, User } from '@prisma/client';
import {
  sub,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
} from 'date-fns';
import {
  resolveEffectiveSubsidiaryId,
  resolveScopeContext,
} from 'src/common/utils/subsidiary-scope';
import { UserRole } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * @param periodFilterDto Dto contenant le filtre de période.
   * @returns filtre de date pour les requêtes Prisma à partir du DTO.
   */
  private getDateFilter(
    periodFilterDto: PeriodFilterDto,
  ): Prisma.DateTimeFilter {
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
        dateFilter = {};
        break;
    }
    return dateFilter;
  }

  /**
   * Resout la filiale effective a interroger a partir de l'utilisateur connecte
   * et d'un id de filiale optionnel demande en query param (drill-down super-admin).
   * Un utilisateur sans scope global est toujours force sur sa propre filiale.
   */
  private resolveSubsidiaryId(
    user: User,
    requestedSubsidiaryId?: string,
  ): string | undefined {
    const ctx = resolveScopeContext(user, [UserRole.FINANCIAL_DIRECTOR]);
    return resolveEffectiveSubsidiaryId(ctx, requestedSubsidiaryId);
  }

  /**
   * @param user Utilisateur connecté.
   * @param periodFilterDto Dto contenant le filtre de période.
   * @param requestedSubsidiaryId Filiale demandee en drill-down (ignoree si l'utilisateur n'a pas de scope global).
   * @returns Statistiques du Tableau de Bord global.
   */
  async getDashboardStats(
    user: User,
    periodFilterDto: PeriodFilterDto,
    requestedSubsidiaryId?: string,
  ) {
    const subsidiaryId = this.resolveSubsidiaryId(user, requestedSubsidiaryId);
    const subsidiaryFilter = subsidiaryId ? { subsidiaryId } : {};
    const dateFilter = this.getDateFilter(periodFilterDto);
    const where: Prisma.SaleWhereInput = {
      ...subsidiaryFilter,
      saleDate: dateFilter,
      status: 'PAID',
    };

    // Ventes totales (basé sur la table Sale)
    const totalSalesResult = await this.prisma.sale.aggregate({
      _sum: { totalPrice: true },
      where: where,
    });

    // Revenu Net = Ventes (le champ `price` a été supprimé du schéma Item,
    // le COGS ne peut plus être calculé automatiquement depuis le catalogue).
    const totalSales =
      totalSalesResult._sum.totalPrice || new Prisma.Decimal(0);
    const netRevenue = totalSales;

    // Nouveaux clients
    const newCustomersCount = await this.prisma.contact.count({
      where: { ...subsidiaryFilter, since: dateFilter },
    });

    // Répartition du stock par catégorie — on charge tous les Item STOCK_PRODUCT
    // avec leurs niveaux de stock pour la filiale ; le champ price ayant été
    // supprimé, la valeur monétaire n'est pas calculable, on expose la quantité.
    const stockItemsWithLevels = await this.prisma.item.findMany({
      where: { type: 'STOCK_PRODUCT' },
      select: {
        category: true,
        stockLevels: {
          where: subsidiaryId ? { subsidiaryId } : {},
          select: { stock: true },
        },
      },
    });

    // Agrégation par catégorie : somme des quantités, puis fallback sur le
    // nombre d'articles si toutes les quantités sont à 0.
    const categoryMap = new Map<
      string,
      { itemCount: number; stockSum: number }
    >();
    for (const item of stockItemsWithLevels) {
      const cat = item.category || 'Non catégorisé';
      const current = categoryMap.get(cat) ?? { itemCount: 0, stockSum: 0 };
      current.itemCount += 1;
      current.stockSum += item.stockLevels.reduce(
        (s, l) => s + Number(l.stock),
        0,
      );
      categoryMap.set(cat, current);
    }

    const hasRealStock = [...categoryMap.values()].some((v) => v.stockSum > 0);
    const stockByCategoryResult = [...categoryMap.entries()].map(
      ([category, { itemCount, stockSum }]) => ({
        category,
        _sum: { stock: hasRealStock ? stockSum : itemCount },
      }),
    );

    const stockValue = new Prisma.Decimal(0);

    // Performance des ventes (agrégation par jour)
    const subsidiarySqlFilter = subsidiaryId
      ? Prisma.sql`"subsidiary_id" = ${subsidiaryId}`
      : Prisma.sql`TRUE`;
    const salesPerformance: { date: string; sales: number }[] = await this
      .prisma.$queryRaw`
      SELECT
        TO_CHAR("sale_date", 'YYYY-MM-DD') as date,
        SUM("total_price")::float as sales
      FROM "sale"
      WHERE ${subsidiarySqlFilter}
        AND status = 'PAID'
        AND (${dateFilter.gte}::timestamp IS NULL OR "sale_date" >= ${dateFilter.gte}::timestamp)
        AND (${dateFilter.lte}::timestamp IS NULL OR "sale_date" <= ${dateFilter.lte}::timestamp)
      GROUP BY date
      ORDER BY date ASC;
    `;

    return {
      totalSales: totalSales.toNumber(),
      netRevenue: netRevenue.toNumber(),
      newCustomers: newCustomersCount,
      stockValue: stockValue.toNumber(),
      salesPerformance,
      stockDistribution: {},
      stockByCategory: stockByCategoryResult,
    };
  }

  /**
   * @param user Utilisateur connecté.
   * @param periodFilterDto Dto contenant le filtre de période.
   * @param requestedSubsidiaryId Filiale demandee en drill-down (ignoree si l'utilisateur n'a pas de scope global).
   * @returns Analyse des ventes.
   */
  async getSalesAnalysis(
    user: User,
    periodFilterDto: PeriodFilterDto,
    requestedSubsidiaryId?: string,
  ) {
    const subsidiaryId = this.resolveSubsidiaryId(user, requestedSubsidiaryId);
    const subsidiaryFilter = subsidiaryId ? { subsidiaryId } : {};
    const dateFilter = this.getDateFilter(periodFilterDto);
    const where: Prisma.SaleWhereInput = {
      ...subsidiaryFilter,
      saleDate: dateFilter,
      status: 'PAID',
    };

    // Chiffre d'affaires total (basé sur la table Sale)
    const totalRevenueResult = await this.prisma.sale.aggregate({
      _sum: { totalPrice: true },
      where: where,
    });

    // Nombre de commandes (en comptant directement dans la table Order)
    const orderCount = await this.prisma.order.count({
      where: {
        ...subsidiaryFilter,
        orderDate: dateFilter,
      },
    });

    // Ventes à la caisse (ventes sans orderId)
    const cashSaleCount = await this.prisma.sale.count({
      where: { ...where, orderId: null },
    });

    const averageBasket =
      orderCount > 0
        ? (totalRevenueResult._sum.totalPrice || new Prisma.Decimal(0)).div(
            orderCount,
          )
        : new Prisma.Decimal(0);

    // Produits les plus vendus (basé sur la table Sale)
    const topSellingProducts = await this.prisma.sale.groupBy({
      by: ['productName'],
      _sum: { quantity: true, totalPrice: true },
      where: where,
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    // Répartition des ventes par catégorie de produits
    // On utilise une requête SQL brute pour joindre `Sale` et `Item` afin d'accéder à la catégorie.
    // Le catalogue de services étant désormais global (sans filiale), le filtre filiale
    // porte uniquement sur `s.subsidiary_id` — la jointure ne peut plus filtrer sur `p.subsidiary_id`.
    const subsidiarySqlFilter = subsidiaryId
      ? Prisma.sql`s.subsidiary_id = ${subsidiaryId}`
      : Prisma.sql`TRUE`;
    const salesByCategory: { category: string; total: number }[] = await this
      .prisma.$queryRaw`
      SELECT
        p.category as "category",
        SUM(s.total_price)::float as total
      FROM "sale" s -- Utilisation de LOWER() pour une jointure insensible à la casse
      JOIN "items" p ON LOWER(s.product_name) = LOWER(p.name)
      WHERE ${subsidiarySqlFilter}
        AND (${dateFilter.gte}::timestamp IS NULL OR s.sale_date >= ${dateFilter.gte}::timestamp)
        AND (${dateFilter.lte}::timestamp IS NULL OR s.sale_date <= ${dateFilter.lte}::timestamp)
      GROUP BY p.category
      ORDER BY total DESC;
    `;

    // Top 5 des meilleurs clients
    const topCustomers = await this.prisma.sale.groupBy({
      by: ['customerId', 'customerName'],
      where: where,
      _sum: {
        totalPrice: true,
      },
      orderBy: {
        _sum: {
          totalPrice: 'desc',
        },
      },
      take: 5,
    });

    return {
      totalRevenue: totalRevenueResult._sum.totalPrice?.toNumber() ?? 0,
      orderCount,
      cashSaleCount,
      averageBasket: averageBasket.toNumber(),
      topSellingProducts,
      salesByCategory,
      topCustomers: topCustomers.map((c) => ({
        customerId: c.customerId,
        customerName: c.customerName,
        totalSpent: c._sum.totalPrice?.toNumber() ?? 0,
      })),
    };
  }

  /**
   * @param user Utilisateur connecté.
   * @param periodFilterDto Dto contenant le filtre de période.
   * @param requestedSubsidiaryId Filiale demandee en drill-down (ignoree si l'utilisateur n'a pas de scope global).
   * @returns Analyse des achats.
   */
  async getPurchaseAnalysis(
    user: User,
    periodFilterDto: PeriodFilterDto,
    requestedSubsidiaryId?: string,
  ) {
    const subsidiaryId = this.resolveSubsidiaryId(user, requestedSubsidiaryId);
    const subsidiaryFilter = subsidiaryId ? { subsidiaryId } : {};
    const dateFilter = this.getDateFilter(periodFilterDto);
    const where: Prisma.PurchaseOrderWhereInput = {
      ...subsidiaryFilter,
      orderDate: dateFilter,
    };

    const totalPurchaseValueResult = await this.prisma.purchaseOrder.aggregate({
      _sum: { totalAmount: true },
      where,
    });

    const totalOrders = await this.prisma.purchaseOrder.count({ where });

    const averageOrderValue =
      totalOrders > 0
        ? (
            totalPurchaseValueResult._sum.totalAmount || new Prisma.Decimal(0)
          ).div(totalOrders)
        : new Prisma.Decimal(0);

    const spendingBySupplier = await this.prisma.purchaseOrder.groupBy({
      by: ['supplierId', 'supplierName'],
      _sum: { totalAmount: true },
      where,
      orderBy: { _sum: { totalAmount: 'desc' } },
    });

    const topPurchasedProducts = await this.prisma.purchaseOrderItem.groupBy({
      by: ['productId', 'productName'],
      _sum: { quantity: true },
      where: { purchaseOrder: where },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    return {
      totalPurchaseValue:
        totalPurchaseValueResult._sum.totalAmount?.toNumber() ?? 0,
      totalOrders,
      averageOrderValue: averageOrderValue.toNumber(),
      spendingBySupplier: spendingBySupplier.map((s) => ({
        ...s,
        _sum: { totalAmount: s._sum.totalAmount?.toNumber() ?? 0 },
      })),
      topPurchasedProducts,
    };
  }
}
