import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { PeriodFilterDto, PeriodFilter } from './dto/period-filter.dto';
import { Prisma, User } from '@prisma/client';
import { sub, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * @param periodFilterDto Dto contenant le filtre de période.
   * @returns filtre de date pour les requêtes Prisma à partir du DTO.
   */
  private getDateFilter(periodFilterDto: PeriodFilterDto): Prisma.DateTimeFilter {
    const { period, startDate, endDate } = periodFilterDto;
    const now = new Date();
    let dateFilter: Prisma.DateTimeFilter = {};

    switch (period) {
      case PeriodFilter.THIS_MONTH:
        dateFilter = { gte: startOfMonth(now), lte: endOfMonth(now) };
        break;
      case PeriodFilter.LAST_MONTH:
        const lastMonth = subMonths(now, 1);
        dateFilter = { gte: startOfMonth(lastMonth), lte: endOfMonth(lastMonth) };
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
          throw new BadRequestException('Pour une période personnalisée, les dates de début et de fin sont requises.');
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
   * @param user Utilisateur connecté.
   * @param periodFilterDto Dto contenant le filtre de période.
   * @returns Statistiques du Tableau de Bord global.
   */
  async getDashboardStats(user: User, periodFilterDto: PeriodFilterDto) {
    const { subsidiaryId } = user;
    const dateFilter = this.getDateFilter(periodFilterDto);
    const where: Prisma.SaleWhereInput = { subsidiaryId, saleDate: dateFilter, status: 'PAID' };

    // Ventes totales (basé sur la table Sale)
    const totalSalesResult = await this.prisma.sale.aggregate({
      _sum: { totalPrice: true },
      where: where,
    });

    // Revenu Net (Ventes - Coût des marchandises vendues)
    // Pour le revenu net, nous devons toujours nous baser sur les commandes pour obtenir le prix d'achat.
    // Mais nous filtrons par les ID de commandes présentes dans les ventes payées.
    const salesWithOrder = await this.prisma.sale.findMany({
      where: { ...where, orderId: { not: null } },
      include: { order: { include: { orderItems: { include: { product: true } } } } }
    });

    let totalCostOfGoods = new Prisma.Decimal(0);
    for (const sale of salesWithOrder) {
      if (sale.order) {
        for (const item of sale.order.orderItems) {
          if (item.product?.price) { // 'price' est le prix d'achat/revient
            totalCostOfGoods = totalCostOfGoods.add(item.product.price.mul(item.quantity));
          }
        }
      }
    }
    const totalSales = totalSalesResult._sum.totalPrice || new Prisma.Decimal(0);
    const netRevenue = totalSales.sub(totalCostOfGoods);

    // Nouveaux clients
    const newCustomersCount = await this.prisma.contact.count({
      where: { subsidiaryId, since: dateFilter },
    });

    // Valeur du stock
    const productsWithStock = await this.prisma.product.findMany({
      where: { subsidiaryId, stock: { gt: 0 } },
      select: { stock: true, price: true, mainCategory: true }
    });
    const stockValue = productsWithStock.reduce((acc, p) => acc.add(p.price.mul(p.stock)), new Prisma.Decimal(0));

    // Performance des ventes (agrégation par jour)
    // Utilisation de SQL brut pour une performance optimale sur le groupement par date.
    const salesPerformance: { date: string, sales: number }[] = await this.prisma.$queryRaw`
      SELECT
        TO_CHAR("sale_date", 'YYYY-MM-DD') as date,
        SUM("total_price")::float as sales
      FROM "sale"
      WHERE "subsidiary_id" = ${subsidiaryId}::uuid
        AND status = 'PAID'
        AND (${dateFilter.gte}::timestamp IS NULL OR "sale_date" >= ${dateFilter.gte}::timestamp)
        AND (${dateFilter.lte}::timestamp IS NULL OR "sale_date" <= ${dateFilter.lte}::timestamp)
      GROUP BY date
      ORDER BY date ASC;
    `;

    // Répartition du stock par catégorie
    const stockByCategoryResult = await this.prisma.product.groupBy({
      by: ['category'],
      where: {
        subsidiaryId,
        stock: { gt: 0 },
      },
      _sum: {
        stock: true, // Quantité totale d'articles par catégorie
      },
    });

    // Pour obtenir la valeur, il faut une autre requête ou un calcul manuel.
    // Ici, nous calculons la valeur monétaire.
    const stockDistribution = productsWithStock.reduce((acc, product) => {
      const category = product.mainCategory || 'Non catégorisé';
      const value = product.price.mul(product.stock);
      acc[category] = (acc[category] || new Prisma.Decimal(0)).add(value);
      return acc;
    }, {} as Record<string, Prisma.Decimal>);

    return {
      totalSales: totalSales.toNumber(),
      netRevenue: netRevenue.toNumber(),
      newCustomers: newCustomersCount,
      stockValue: stockValue.toNumber(),
      salesPerformance,
      stockDistribution: Object.fromEntries(
        Object.entries(stockDistribution).map(([key, value]) => [key, value.toNumber()])
      ),
      stockByCategory: stockByCategoryResult
    };
  }

  /**
   * @param user Utilisateur connecté.
   * @param periodFilterDto Dto contenant le filtre de période.
   * @returns Analyse des ventes.
   */
  async getSalesAnalysis(user: User, periodFilterDto: PeriodFilterDto) {
    const { subsidiaryId } = user;
    const dateFilter = this.getDateFilter(periodFilterDto);
    const where: Prisma.SaleWhereInput = { subsidiaryId, saleDate: dateFilter, status: 'PAID' };

    // Chiffre d'affaires total (basé sur la table Sale)
    const totalRevenueResult = await this.prisma.sale.aggregate({
      _sum: { totalPrice: true },
      where: where,
    });

    // Nombre de commandes (en comptant directement dans la table Order)
    const orderCount = await this.prisma.order.count({
      where: {
        subsidiaryId,
        orderDate: dateFilter,
      },
    });

    // Ventes à la caisse (ventes sans orderId)
    const cashSaleCount = await this.prisma.sale.count({ where: { ...where, orderId: null } });

    const averageBasket = orderCount > 0 ? (totalRevenueResult._sum.totalPrice || new Prisma.Decimal(0)).div(orderCount) : new Prisma.Decimal(0);

    // Produits les plus vendus (basé sur la table Sale)
    const topSellingProducts = await this.prisma.sale.groupBy({
      by: ['productName'],
      _sum: { quantity: true, totalPrice: true },
      where: where,
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    // Répartition des ventes par catégorie de produits
    // On utilise une requête SQL brute pour joindre `Sale` et `Product` afin d'accéder à la catégorie.
    const salesByCategory: { category: string, total: number }[] = await this.prisma.$queryRaw`
      SELECT
        p.category as "category",
        SUM(s.total_price)::float as total
      FROM "sale" s -- Utilisation de LOWER() pour une jointure insensible à la casse
      JOIN "products" p ON LOWER(s.product_name) = LOWER(p.product_name) AND s.subsidiary_id = p.subsidiary_id
      WHERE s.subsidiary_id = ${subsidiaryId}::uuid
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
      topCustomers: topCustomers.map(c => ({
        customerId: c.customerId,
        customerName: c.customerName,
        totalSpent: c._sum.totalPrice?.toNumber() ?? 0,
      })),
    };
  }

  /**
   * @param user Utilisateur connecté.
   * @param periodFilterDto Dto contenant le filtre de période.
   * @returns Analyse des achats.
   */
  async getPurchaseAnalysis(user: User, periodFilterDto: PeriodFilterDto) {
    const { subsidiaryId } = user;
    const dateFilter = this.getDateFilter(periodFilterDto);
    const where: Prisma.PurchaseOrderWhereInput = { subsidiaryId, orderDate: dateFilter };

    const totalPurchaseValueResult = await this.prisma.purchaseOrder.aggregate({
      _sum: { totalAmount: true },
      where,
    });

    const totalOrders = await this.prisma.purchaseOrder.count({ where });

    const averageOrderValue = totalOrders > 0 ? (totalPurchaseValueResult._sum.totalAmount || new Prisma.Decimal(0)).div(totalOrders) : new Prisma.Decimal(0);

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
      totalPurchaseValue: totalPurchaseValueResult._sum.totalAmount?.toNumber() ?? 0,
      totalOrders,
      averageOrderValue: averageOrderValue.toNumber(),
      spendingBySupplier: spendingBySupplier.map(s => ({ ...s, _sum: { totalAmount: s._sum.totalAmount?.toNumber() ?? 0 } })),
      topPurchasedProducts,
    };
  }
}
