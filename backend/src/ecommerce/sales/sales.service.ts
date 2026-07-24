import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { CreateDirectSaleDto } from './dto/create-sale.dto';
import { FindAllSalesDto, OrderPeriod } from './dto/find-all-sales.dto';
import { ItemType, Prisma, SaleStatus, UserRole } from '@prisma/client';
import { ProductSpecsService } from '../products/product-specs/product-specs.service';
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly productSpecsService: ProductSpecsService,
  ) {}

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
      // 1. Récupérer les données de référence (services du catalogue, Taxe, Client)
      const productIds = items.map((item) => item.productId);
      const [products, taxRate, customer] = await Promise.all([
        tx.item.findMany({
          where: { id: { in: productIds }, type: ItemType.SERVICE },
        }),
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

      // Chantier 5 (Caisse) : même principe que orders.service.ts — récupère
      // la définition de formulaire de chaque produit distinct, valide les
      // valeurs saisies au comptoir, et fige un instantané sur la vente.
      const distinctProductIds = [...new Set<string>(productIds)];
      const formDefinitionByProductId = new Map(
        await Promise.all(
          distinctProductIds.map(async (productId) => {
            const definition =
              await this.productSpecsService.getFormDefinition(productId);
            return [productId, definition] as const;
          }),
        ),
      );

      for (const item of items) {
        const definition = formDefinitionByProductId.get(item.productId);
        if (definition) {
          this.productSpecsService.validateAgainstDefinition(
            definition,
            item.specValues,
          );
        }
      }

      // 2. Préparer les données pour la création des ventes.
      // Le prix est celui négocié au comptoir, jamais tiré du catalogue.
      const salesToCreate: Prisma.SaleCreateManyInput[] = items.map((item) => {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new NotFoundException(
            `Produit avec ID ${item.productId} non trouvé.`,
          );
        }

        const unitPrice = new Prisma.Decimal(item.unitPrice);
        const subtotal = unitPrice.mul(item.quantity);
        const taxAmount = subtotal.mul(taxRate.rate);
        const totalPrice = subtotal.add(taxAmount);

        return {
          productName: product.name,
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
          specValues: item.specValues as Prisma.InputJsonValue | undefined,
          specSnapshot: formDefinitionByProductId.get(
            item.productId,
          ) as unknown as Prisma.InputJsonValue | undefined,
        };
      });

      // 3. Créer les enregistrements de vente (le stock de matières n'est jamais
      // décrémenté automatiquement — voir le flux manuel "Prélever les matières")
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
