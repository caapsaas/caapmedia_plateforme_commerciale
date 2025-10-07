// src/ecommerce/orders/orders.service.ts

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { CreateOrderDto, UpdateProductionStatusDto } from './dto/create-order.dto';
import { Order, OrderGroup, OrderStatus, PaymentStatus, Prisma, ProductionStatus } from '@prisma/client';
import { FindAllOrdersDto, OrderPeriod } from './dto/find-all-orders.dto';
import { sub, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) { }

  /**
   * Crée une nouvelle commande.
   * La logique est encapsulée dans une transaction pour garantir l'intégrité des données.
   */
  async create(createOrderDto: CreateOrderDto, user: any, designFiles?: Express.Multer.File[]) {
    const { items, customerName, paymentDueDate, source, opportunityId } = createOrderDto;
    // Le corps d'un formulaire multipart est toujours en string, il faut parser les items.
    const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;

    const { userId, subsidiaryId } = user; // On suppose que le client est un 'user' avec un 'userId'

    if (!items || items.length === 0) {
      throw new BadRequestException('Une commande doit contenir au moins un article.');
    }

    // 1. Récupérer toutes les données de référence (Produits, Taxe par défaut)
    const productIds = parsedItems.map((item) => item.productId);
    const [products, taxRate] = await Promise.all([
      this.prisma.product.findMany({ where: { id: { in: productIds } } }),
      this.prisma.taxRate.findFirstOrThrow({ where: { isDefault: true } }),
    ]);

    if (products.length !== productIds.length) {
      throw new NotFoundException('Un ou plusieurs produits sont introuvables.');
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // 2. Regrouper les articles par filiale (subsidiaryId)
    const itemsBySubsidiary = new Map<string, any[]>();
    for (const item of parsedItems) {
      const product = productMap.get(item.productId);
      if (!product) {
        // Cette erreur ne devrait pas se produire grâce à la validation précédente
        continue;
      }
      const subsidiaryId = product.subsidiaryId;
      if (!itemsBySubsidiary.has(subsidiaryId)) {
        itemsBySubsidiary.set(subsidiaryId, []);
      }
      itemsBySubsidiary.get(subsidiaryId)!.push({ ...item, product });
    }

    // 3. Exécuter la création dans une transaction globale
    return this.prisma.$transaction(async (tx) => {
      const createdOrders: Order[] = [];
      let orderGroup: OrderGroup | null = null;
      let overallTotalAmount = 0;

      // Calculer le montant total global pour le groupe de commandes
      for (const item of parsedItems) {
        const product = productMap.get(item.productId)!;
        overallTotalAmount += product.sellingPrice.toNumber() * item.quantity;
      }
      // Ajouter la taxe au montant total global
      overallTotalAmount = overallTotalAmount * (1 + taxRate.rate.toNumber());

      // Si plusieurs filiales sont concernées, créer un OrderGroup
      if (itemsBySubsidiary.size > 1) {
        orderGroup = await tx.orderGroup.create({
          data: {
            groupCode: `GRP-${Date.now()}`, // Générer un code de groupe unique
            customerId: userId, // Utiliser l'ID de l'utilisateur connecté
            totalAmount: overallTotalAmount,
          },
        });
      }

      // Créer une commande (ou sous-commande) pour chaque filiale
      for (const [subsidiaryId, subsidiaryItems] of itemsBySubsidiary.entries()) {
        // Calculer les totaux pour cette sous-commande
        let subtotal = 0;
        const orderItemsData = subsidiaryItems.map((item) => {
          const unitPrice = item.product.sellingPrice;
          subtotal += unitPrice.toNumber() * item.quantity;
          return {
            ...item,
            unitPrice,
          };
        });

        const taxAmount = subtotal * taxRate.rate.toNumber();
        const totalAmount = subtotal + taxAmount;

        // Créer la commande
        const newOrder = await tx.order.create({
          data: {
            customerName,
            paymentDueDate: new Date(paymentDueDate),
            source,
            subtotal,
            taxAmount,
            totalAmount,
            taxRateValue: taxRate.rate,
            status: OrderStatus.NEW,
            productionStatus: ProductionStatus.PREPRESS,
            paymentStatus: PaymentStatus.UNPAID,
            // Relations
            customerId: userId, // Utiliser l'ID de l'utilisateur connecté
            subsidiaryId,
            taxRateId: taxRate.id,
            salesRepId: userId,
            opportunityId,
            groupId: orderGroup?.id, // Lier au groupe si il existe
            // Création imbriquée des articles et de l'historique
            orderItems: {
              create: orderItemsData.map((item, index) => {
                // Associer le fichier au bon article.
                // On suppose que l'ordre des fichiers correspond à l'ordre des articles.
                const file = designFiles?.[index];
                return {
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                designFileName: file?.originalname,
                designFileUrl: file ? `/api-caapsaas/order_item_img/${file.filename}` : undefined,
                productId: item.productId,
                productOptions: item.options
                  ? {
                    create: item.options.map((opt) => ({
                      optionType: opt.optionType,
                      optionValue: opt.optionValue,
                    })),
                  }
                  : undefined,
                };
              }),
            },
            productionHistory: {
              create: {
                status: ProductionStatus.PREPRESS,
              },
            },
          },
        });
        createdOrders.push(newOrder);
      }

      // Retourner le groupe de commande avec ses sous-commandes, ou la commande unique
      if (orderGroup) {
        return tx.orderGroup.findUniqueOrThrow({
          where: { id: orderGroup.id },
          include: { orders: { include: { orderItems: true } } },
        });
      } else {
        // S'il n'y a qu'une seule commande, on la retourne directement
        return tx.order.findUniqueOrThrow({
          where: { id: createdOrders[0].id },
          include: { orderItems: true },
        });
      }
    });
  }

  /**
   * Récupère toutes les commandes pour la filiale de l'utilisateur.
   */
  async findAll(user: any, query: FindAllOrdersDto) {
    const { customerId, productId, orderStatus, paymentStatus, period, startDate, endDate } = query;
    const where: Prisma.OrderWhereInput = {
      subsidiaryId: user.subsidiaryId,
    };

    if (customerId) {
      where.customerId = customerId;
    }

    if (productId) {
      where.orderItems = { some: { productId } };
    }

    if (orderStatus) {
      where.status = orderStatus;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (period && period !== OrderPeriod.ALL_TIME) {
      const now = new Date();
      let dateFilter: { gte?: Date; lte?: Date } = {};

      if (period === OrderPeriod.THIS_MONTH) {
        dateFilter = { gte: startOfMonth(now), lte: endOfMonth(now) };
      } else if (period === OrderPeriod.LAST_MONTH) {
        const lastMonth = subMonths(now, 1);
        dateFilter = { gte: startOfMonth(lastMonth), lte: endOfMonth(lastMonth) };
      } else if (period === OrderPeriod.LAST_7_DAYS) {
        dateFilter = { gte: sub(now, { days: 7 }) };
      } else if (period === OrderPeriod.LAST_30_DAYS) {
        dateFilter = { gte: sub(now, { days: 30 }) };
      } else if (period === OrderPeriod.LAST_90_DAYS) {
        dateFilter = { gte: sub(now, { days: 90 }) };
      } else if (period === OrderPeriod.THIS_YEAR) {
        dateFilter = { gte: startOfYear(now), lte: endOfYear(now) };
      } else if (period === OrderPeriod.CUSTOM) {
        if (!startDate || !endDate) {
          throw new BadRequestException('Pour une période personnalisée, les dates de début et de fin sont requises.');
        }
        dateFilter = { gte: new Date(startDate), lte: new Date(endDate) };
      }
      where.orderDate = dateFilter;
    }

    return this.prisma.order.findMany({
      where,
      include: {
        customer: true,
        salesRep: true,
        orderItems: { include: { product: true } },
      },
      orderBy: { orderDate: 'desc' },
    });
  }

  /**
   * Récupère une commande spécifique par son ID.
   */
  async findOne(id: string, user: any) {
    const order = await this.prisma.order.findUnique({
      where: { id, subsidiaryId: user.subsidiaryId },
      include: {
        orderItems: { include: { product: true, productOptions: true } },
        productionHistory: { orderBy: { changeDate: 'asc' } },
        customer: true,
        salesRep: true,
        taxRate: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Commande avec l'ID "${id}" non trouvée.`);
    }
    return order;
  }

  /**
   * Met à jour le statut de production d'une commande et enregistre l'historique.
   */
  async updateProductionStatus(id: string, updateDto: UpdateProductionStatusDto, user: any) {
    // Vérifier que la commande existe et appartient à la bonne filiale
    await this.findOne(id, user);

    return this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id },
        data: { productionStatus: updateDto.status },
      });

      await tx.orderProductionHistory.create({
        data: {
          orderId: id,
          status: updateDto.status,
        },
      });

      return updatedOrder;
    });
  }

  /**
   * Récupère les commandes pour un client spécifique.
   */
  async findGroupsByCustomer(customerId: string) {
    const groups = await this.prisma.orderGroup.findMany({
      where: { customerId },
      include: {
        orders: {
          include: {
            orderItems: {
              include: { product: true, productOptions: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return groups.map((group) => ({
      groupId: group.id,
      groupCode: group.groupCode,
      totalAmount: group.totalAmount.toNumber(),
      createdAt: group.createdAt,
      orders: group.orders.map((order) => ({
        orderId: order.id,
        subsidiaryId: order.subsidiaryId,
        subtotal: order.subtotal.toNumber(),
        taxAmount: order.taxAmount.toNumber(),
        totalAmount: order.totalAmount.toNumber(),
        status: order.status,
        orderItems: order.orderItems.map((item) => ({
          productName: item.product?.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toNumber(),
          options: item.productOptions?.map((opt) => ({
            optionType: opt.optionType,
            optionValue: opt.optionValue,
          })),
        })),
      })),
    }));
  }

  async getBestSellingProducts(user: any, limit = 10) {
    const { subsidiaryId } = user;

    // Utilisation de $queryRaw pour une agrégation complexe et performante
    const result: {
      product_id: string;
      product_name: string;
      total_quantity: number;
      total_revenue: number;
    }[] = await this.prisma.$queryRaw`
      SELECT
        p.id AS product_id,
        p.product_name,
        SUM(oi.quantity)::float AS total_quantity,
        SUM(oi.quantity * oi.unit_price)::float AS total_revenue
      FROM "order_item" oi
      JOIN "products" p ON oi.product_id = p.id
      JOIN "orders" o ON oi.order_id = o.id
      WHERE o.subsidiary_id = ${subsidiaryId}::uuid
        AND o.status != 'CANCELLED'
        AND oi.product_id IS NOT NULL
      GROUP BY p.id, p.product_name
      ORDER BY total_revenue DESC
      LIMIT ${limit};
    `;

    return result.map(r => ({
      productName: r.product_name,
      quantity: r.total_quantity,
      totalRevenue: r.total_revenue,
    }));
  }
  

}
