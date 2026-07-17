import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { CreateDirectSaleDto } from './dto/create-sale.dto';
import { FindAllSalesDto, OrderPeriod } from './dto/find-all-sales.dto';
import { Prisma, SaleStatus, UserRole } from '@prisma/client';
import {
  sub,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
} from 'date-fns';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crée une vente directe (vente au comptoir).
   * @param createDirectSaleDto Les données de la vente
   * @param user L'utilisateur connecté (caissier)
   */
  async createDirectSale(createDirectSaleDto: CreateDirectSaleDto, user: any) {
    const { items, paymentMethod, customerId } = createDirectSaleDto;
    const { userId: salesRepId, subsidiaryId } = user;

    if (!items || items.length === 0) {
      throw new BadRequestException(
        'Une vente doit contenir au moins un article.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Récupérer les données de référence (Produits, Taxe, Client)
      const productIds = items.map((item) => item.productId);
      const [products, taxRate, customer] = await Promise.all([
        tx.product.findMany({ where: { id: { in: productIds } } }),
        tx.taxRate.findFirstOrThrow({ where: { isDefault: true } }),
        tx.contact.findUnique({ where: { id: customerId } }),
      ]);

      if (!customer) {
        throw new NotFoundException(
          `Client avec l'ID ${customerId} non trouvé.`,
        );
      }

      if (products.length !== productIds.length) {
        throw new NotFoundException(
          'Un ou plusieurs produits sont introuvables.',
        );
      }

      const productMap = new Map(products.map((p) => [p.id, p]));

      // 2. Préparer les données pour la création des ventes
      const salesToCreate: Prisma.SaleCreateManyInput[] = items.map((item) => {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new NotFoundException(
            `Produit avec ID ${item.productId} non trouvé.`,
          );
        }

        // Vérifier que tous les produits appartiennent à la filiale du caissier
        if (product.subsidiaryId !== subsidiaryId) {
          throw new BadRequestException(
            `Le produit "${product.productName}" n'appartient pas à cette filiale.`,
          );
        }

        const unitPrice = product.sellingPrice;
        const subtotal = unitPrice.mul(item.quantity);
        const taxAmount = subtotal.mul(taxRate.rate);
        const totalPrice = subtotal.add(taxAmount);

        return {
          productName: product.productName,
          quantity: item.quantity,
          totalPrice: totalPrice,
          saleDate: new Date(),
          customerName: customer.contactName,
          taxRate: taxRate.rate,
          paymentMethod: paymentMethod,
          customerId: customerId,
          subsidiaryId: subsidiaryId,
          salesRepId: salesRepId,
          orderId: null, // Pas de commande associée pour une vente directe
          status: SaleStatus.PAID, // Une vente directe est toujours considérée comme payée
        };
      });

      // 3. Mettre à jour le stock des produits
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // 4. Créer les enregistrements de vente
      const result = await tx.sale.createMany({
        data: salesToCreate,
      });

      return {
        message: `${result.count} vente(s) enregistrée(s) avec succès.`,
      };
    });
  }

  /**
   * Récupère toutes les ventes d'une filiale avec des options de filtrage.
   * @param user L'utilisateur connecté
   * @param query Les paramètres de filtrage
   */
  async findAll(user: any, query: FindAllSalesDto) {
    const {
      customerId,
      salesRepId,
      paymentMethod,
      period,
      startDate,
      endDate,
    } = query;
    const { subsidiaryId, userRole, userId } = user;

    const where: Prisma.SaleWhereInput = {
      subsidiaryId: subsidiaryId,
    };

    // Si l'utilisateur est un commercial, il ne voit que ses propres ventes.
    if (userRole === UserRole.COMMERCIAL) {
      where.salesRepId = userId;
    } else if (salesRepId) {
      // Les autres rôles (Admin, etc.) peuvent filtrer par commercial.
      where.salesRepId = salesRepId;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    // Gestion du filtre par période
    if (period && period !== OrderPeriod.ALL_TIME) {
      const now = new Date();
      let dateFilter: { gte?: Date; lte?: Date } = {};

      if (period === OrderPeriod.THIS_MONTH) {
        dateFilter = { gte: startOfMonth(now), lte: endOfMonth(now) };
      } else if (period === OrderPeriod.LAST_MONTH) {
        const lastMonth = subMonths(now, 1);
        dateFilter = {
          gte: startOfMonth(lastMonth),
          lte: endOfMonth(lastMonth),
        };
      } else if (period === OrderPeriod.LAST_7_DAYS) {
        dateFilter = { gte: sub(now, { days: 7 }) };
      } else if (period === OrderPeriod.LAST_30_DAYS) {
        dateFilter = { gte: sub(now, { days: 30 }) };
      } else if (period === OrderPeriod.THIS_YEAR) {
        dateFilter = { gte: startOfYear(now), lte: endOfYear(now) };
      } else if (period === OrderPeriod.CUSTOM) {
        if (!startDate || !endDate) {
          throw new BadRequestException(
            'Pour une période personnalisée, les dates de début et de fin sont requises.',
          );
        }
        dateFilter = { gte: new Date(startDate), lte: new Date(endDate) };
      }
      where.saleDate = dateFilter;
    }

    return this.prisma.sale.findMany({
      where,
      include: { customer: true, salesRep: true },
      orderBy: { saleDate: 'desc' },
    });
  }
}
