// src/ecommerce/orders/orders.service.ts

import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service'; // Assurez-vous que ce chemin est correct
import { CreateOrderDto, CreateOrderBySalesRepDto, RecordPaymentDto, UpdateProductionStatusDto } from './dto/create-order.dto';
import { Order, OrderGroup, OrderStatus, PaymentStatus, Prisma, ProductionStatus } from '@prisma/client';
import { FindAllOrdersDto, OrderPeriod } from './dto/find-all-orders.dto';
import { sub, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) { }

  // Fonction utilitaire pour mapper une commande à son format de réponse
  private mapOrderToResponse(order: any) {
    return {
      orderId: order.id,
      subsidiaryId: order.subsidiaryId,
      subtotal: order.subtotal.toNumber(),
      taxAmount: order.taxAmount.toNumber(),
      totalAmount: order.totalAmount.toNumber(),
      status: order.status,
      orderItems: order.orderItems.map((item: any) => ({
        productName: item.product?.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toNumber(),
        options: item.productOptions?.map((opt: any) => ({
          optionType: opt.optionType,
          optionValue: opt.optionValue,
        })),
      })),
    };
  }

  /**
   * 
   * @param createOrderDto // DTO contenant les données de la commande à créer
   * @param user // Utilisateur connecté
   * @param designFiles // Fichiers uploadés
   * @returns // Commande créée
   */
  async create(createOrderDto: CreateOrderDto, user: any, designFiles?: Express.Multer.File[]) {
    const { items, customerName, paymentDueDate, source, opportunityId } = createOrderDto;

    const paymentDue = new Date(paymentDueDate);
    if (isNaN(paymentDue.getTime())) {
      throw new BadRequestException('Date de paiement invalide');
    }

    // Le corps d'un formulaire multipart est toujours en string, il faut parser les items.
    const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;

    const { id: customerId } = user; // L'utilisateur connecté est le client

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
            customerId: customerId, // Utiliser l'ID de l'utilisateur connecté
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
            paymentDueDate: paymentDue,
            source,
            subtotal,
            taxAmount,
            totalAmount,
            taxRateValue: taxRate.rate,
            status: OrderStatus.NEW,
            productionStatus: ProductionStatus.PREPRESS,
            paymentStatus: PaymentStatus.UNPAID,
            // Relations
            customerId: customerId, // Utiliser l'ID de l'utilisateur connecté
            subsidiaryId,
            taxRateId: taxRate.id,
            opportunityId,
            groupId: orderGroup?.id, // Lier au groupe si il existe
            // Création imbriquée des articles et de l'historique
            orderItems: {
              create: orderItemsData.map((item, index) => {
                // Associer le fichier au bon article.
                // On suppose que l'ordre des fichiers correspond à l'ordre des articles.
                const file = designFiles?.[index];
                return {
                  quantity: parseInt(item.quantity),
                  unitPrice: item.unitPrice,
                  designFileName: file?.originalname ? file.originalname : item.designFileName,
                  designFileUrl: file ? `/api-caapsaas/order_item_img/${file.filename}` : item.designFileUrl,
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
   * 
   * @param createOrderDto // DTO contenant les données de la commande à créer
   * @param user // Utilisateur connecté
   * @param designFiles // Fichiers uploadés
   * @returns // Commande créée
   */
  async createBySalesRep(createOrderDto: CreateOrderBySalesRepDto, user: any, designFiles?: Express.Multer.File[]) {
    const { items, customerId, customerName, paymentDueDate, source, opportunityId } = createOrderDto;

    // Le corps d'un formulaire multipart est toujours en string, il faut parser les items.
    const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;

    const { userId: salesRepId, subsidiaryId: salesRepSubsidiaryId } = user;

    if (!parsedItems || parsedItems.length === 0) {
      throw new BadRequestException('Une commande doit contenir au moins un article.');
    }

    // 1. Récupérer toutes les données de référence (Produits, Taxe par défaut, Client)
    const productIds = parsedItems.map((item) => item.productId);
    const [products, taxRate, customer] = await Promise.all([
      this.prisma.product.findMany({ where: { id: { in: productIds } } }),
      this.prisma.taxRate.findFirstOrThrow({ where: { isDefault: true } }),
      this.prisma.contact.findUniqueOrThrow({ where: { id: customerId } }),
    ]);

    // Valider que le client appartient à la même filiale que le commercial
    if (customer.subsidiaryId !== salesRepSubsidiaryId) {
      throw new BadRequestException('Le client sélectionné n\'appartient pas à votre filiale.');
    }

    if (products.length !== productIds.length) {
      throw new NotFoundException('Un ou plusieurs produits sont introuvables.');
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // 2. Regrouper les articles par filiale (subsidiaryId) du produit
    const itemsBySubsidiary = new Map<string, any[]>();
    for (const item of parsedItems) {
      const product = productMap.get(item.productId);
      if (!product) {
        continue;
      }
      const productSubsidiaryId = product.subsidiaryId;
      if (!itemsBySubsidiary.has(productSubsidiaryId)) {
        itemsBySubsidiary.set(productSubsidiaryId, []);
      }
      itemsBySubsidiary.get(productSubsidiaryId)!.push({ ...item, product });
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
      overallTotalAmount = overallTotalAmount * (1 + taxRate.rate.toNumber());

      // Si plusieurs filiales sont concernées, créer un OrderGroup
      if (itemsBySubsidiary.size > 1) {
        orderGroup = await tx.orderGroup.create({
          data: {
            groupCode: `GRP-${Date.now()}`,
            customerId: customerId,
            totalAmount: overallTotalAmount,
          },
        });
      }

      // Créer une commande (ou sous-commande) pour chaque filiale
      for (const [subsidiaryId, subsidiaryItems] of itemsBySubsidiary.entries()) {
        let subtotal = 0;
        const orderItemsData = subsidiaryItems.map((item) => {
          const unitPrice = item.product.sellingPrice;
          subtotal += unitPrice.toNumber() * item.quantity;
          return { ...item, unitPrice };
        });

        const taxAmount = subtotal * taxRate.rate.toNumber();
        const totalAmount = subtotal + taxAmount;

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
            customerId: customerId,
            subsidiaryId, // Filiale du produit
            taxRateId: taxRate.id,
            salesRepId: salesRepId, // ID du commercial connecté
            opportunityId,
            groupId: orderGroup?.id,
            orderItems: {
              create: orderItemsData.map((item, index) => {
                const file = designFiles?.[index];
                return {
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  designFileName: file?.originalname,
                  designFileUrl: file ? `/api-caapsaas/order_item_img/${file.filename}` : undefined,
                  productId: item.productId,
                  productOptions: item.options
                    ? { create: item.options.map((opt) => ({ optionType: opt.optionType, optionValue: opt.optionValue })) }
                    : undefined,
                };
              }),
            },
            productionHistory: {
              create: { status: ProductionStatus.PREPRESS },
            },
          },
        });
        createdOrders.push(newOrder);
      }

      if (orderGroup) {
        return tx.orderGroup.findUniqueOrThrow({
          where: { id: orderGroup.id },
          include: { orders: { include: { orderItems: true } } },
        });
      } else {
        return tx.order.findUniqueOrThrow({
          where: { id: createdOrders[0].id },
          include: { orderItems: true },
        });
      }
    });
  }

  /**
   * 
   * @param user // Utilisateur connecté
   * @param query // Paramètres de la requête
   * @returns // Liste des commandes
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
   * 
   * @param id // ID de la commande
   * @param user // Utilisateur connecté
   * @returns // Commande trouvée
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
   * 
   * @param id // ID de la commande
   * @param updateDto // DTO contenant le statut de production à mettre à jour
   * @param user // Utilisateur connecté
   * @returns // Commande mise à jour
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
   * 
   * @param customerId // ID du client
   * @returns // Liste des commandes du client
   */
  async findGroupsByCustomer(customerId: string) {
    const [groups, singleOrders] = await Promise.all([
      // 1. Récupérer les groupes de commandes existants
      this.prisma.orderGroup.findMany({
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
      }),
      // 2. Récupérer les commandes uniques (non groupées)
      this.prisma.order.findMany({
        where: { customerId, groupId: null },
        include: {
          orderItems: {
            include: { product: true, productOptions: true },
          },
        },
      }),
    ]);

    // 3. Mapper les vrais groupes de commandes
    const groupedOrders = groups.map((group) => ({
      groupId: group.id,
      groupCode: group.groupCode,
      totalAmount: group.totalAmount.toNumber(),
      createdAt: group.createdAt,
      orders: group.orders.map(this.mapOrderToResponse),
    }));

    // 4. Créer des "groupes synthétiques" pour les commandes uniques
    const singleOrderGroups = singleOrders.map((order) => ({
      groupId: order.id, // Utiliser l'ID de la commande comme ID de groupe
      groupCode: `ORD-${order.id.substring(0, 8)}`, // Créer un code de groupe synthétique
      totalAmount: order.totalAmount.toNumber(),
      createdAt: order.orderDate,
      orders: [this.mapOrderToResponse(order)], // La commande est la seule de son "groupe"
    }));

    // 5. Combiner et trier les résultats
    const allOrders = [...groupedOrders, ...singleOrderGroups];
    allOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return allOrders;
  }

  /**
   * 
   * @param user // Utilisateur connecté
   * @param limit // Nombre de produits à retourner
   * @returns // Liste des produits les plus vendus
   */
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

  /**
   * Enregistre un paiement pour une commande.
   * @param id ID de la commande
   * @param recordPaymentDto DTO contenant le montant à payer
   * @param user Utilisateur connecté
   * @returns La commande mise à jour avec le solde
   */
  async recordPayment(id: string, recordPaymentDto: RecordPaymentDto, user: any) {
    const { amount } = recordPaymentDto;

    return this.prisma.$transaction(async (tx) => {
      // 1. Récupérer la commande et vérifier les droits
      const order = await tx.order.findUnique({
        where: { id },
      });

      if (!order) {
        throw new NotFoundException(`Commande avec l'ID "${id}" non trouvée.`);
      }

      // 2. Valider le paiement
      const totalAmount = order.totalAmount.toNumber();
      const alreadyPaid = order.amountPaid.toNumber();
      const remainingBalance = totalAmount - alreadyPaid;

      if (amount > remainingBalance) {
        throw new BadRequestException(`Le montant du paiement (${amount}) dépasse le solde restant (${remainingBalance}).`);
      }

      // 3. Mettre à jour le montant payé et le statut
      const newAmountPaid = alreadyPaid + amount;
      let newPaymentStatus: PaymentStatus = PaymentStatus.PARTIALLY_PAID;
      if (newAmountPaid >= totalAmount) {
        newPaymentStatus = PaymentStatus.PAID;
      }

      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          amountPaid: newAmountPaid,
          paymentStatus: newPaymentStatus,
        },
      });

      return updatedOrder;
    });
  }

}
