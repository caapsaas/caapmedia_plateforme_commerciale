import {
  BadRequestException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import {
  CreateOrderBySalesRepDto,
  RecordPaymentDto,
  UpdateOrderStatusDto,
  updateProductionStatusDto,
} from './dto/create-order.dto';
import {
  OrderStatus,
  PaymentStatus,
  Prisma,
  ProductionStatus,
  SaleStatus,
  ItemType,
} from '@prisma/client';
import { FindAllOrdersDto, OrderPeriod } from './dto/find-all-orders.dto';
import {
  sub,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
} from 'date-fns';
import { Decimal } from '@prisma/client/runtime/library';
import { ProductSpecsService } from '../products/product-specs/product-specs.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productSpecsService: ProductSpecsService,
  ) {}

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
        productName: item.product?.name,
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
   * Met à jour le compte crédit d'un client.
   * Crée le compte s'il n'existe pas.
   */
  private async updateCustomerCredit(
    tx: Prisma.TransactionClient,
    contactId: string,
    subsidiaryId: string,
    amount: Decimal,
    clientName: string,
    companyName: string,
  ) {
    const creditAccount = await tx.creditAccount.findUnique({
      where: { contactId },
    });

    if (creditAccount) {
      await tx.creditAccount.update({
        where: { id: creditAccount.id },
        data: {
          balance: { increment: amount },
          lastPaymentDate: new Date(),
        },
      });
    } else {
      await tx.creditAccount.create({
        data: {
          balance: amount,
          lastPaymentDate: new Date(),
          contact: { connect: { id: contactId } },
          subsidiary: { connect: { id: subsidiaryId } },
          clientName: clientName,
          companyName: companyName,
        },
      });
    }
  }

  /**
   * Crée une commande pour le compte d'un client, à l'initiative d'un commercial.
   * Le prix de chaque ligne est celui négocié par le commercial (jamais tiré du
   * catalogue) et la commande est toujours rattachée à la filiale du commercial connecté.
   * @param createOrderDto // DTO contenant les données de la commande à créer
   * @param user // Utilisateur connecté
   * @param designFiles // Fichiers uploadés
   * @returns // Commande créée
   */
  async createBySalesRep(
    createOrderDto: CreateOrderBySalesRepDto,
    user: any,
    designFiles?: Express.Multer.File[],
  ) {
    const {
      items,
      customerId,
      customerName,
      paymentDueDate,
      source,
      opportunityId,
    } = createOrderDto;

    // Le corps d'un formulaire multipart est toujours en string, il faut parser les items.
    const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;

    const { userId: salesRepId, subsidiaryId: salesRepSubsidiaryId } = user;

    if (!parsedItems || parsedItems.length === 0) {
      throw new BadRequestException(
        'Une commande doit contenir au moins un article.',
      );
    }

    // Validation explicite: vérifier que tous les articles ont un productId
    const itemsWithoutProductId = parsedItems.filter((item) => !item.productId);
    if (itemsWithoutProductId.length > 0) {
      throw new BadRequestException(
        'Tous les articles doivent avoir un productId. Articles invalides: ' +
          JSON.stringify(itemsWithoutProductId, null, 2),
      );
    }

    const productIds = parsedItems.map((item) => item.productId);

    const [products, taxRate, customer] = await Promise.all([
      this.prisma.item.findMany({
        where: { id: { in: productIds }, type: ItemType.SERVICE },
      }),
      this.prisma.taxRate.findFirstOrThrow({ where: { isDefault: true } }),
      this.prisma.contact.findUniqueOrThrow({ where: { id: customerId } }),
    ]);

    // Le client est une entité globale (Chantier 6) : il peut avoir été créé
    // dans une autre filiale, la commande reste tout de même rattachée à la
    // filiale du commercial connecté (pas de blocage sur l'origine du client).

    if (products.length !== productIds.length) {
      throw new NotFoundException(
        'Un ou plusieurs services sont introuvables.',
      );
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Chantier 5 : récupère la définition de formulaire de chaque produit
    // distinct (une seule requête par produit) puis valide CHAQUE ligne
    // individuellement — deux lignes du même produit peuvent avoir des
    // spécifications différentes. La définition figée sert d'instantané,
    // jamais affectée par une modification ultérieure du produit. Ne jamais
    // faire confiance à la validation frontend seule.
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

    for (const item of parsedItems) {
      const definition = formDefinitionByProductId.get(item.productId);
      if (definition) {
        this.productSpecsService.validateAgainstDefinition(
          definition,
          item.specValues,
        );
      }
    }

    // Validation des marges : si au moins une ligne de service a un résumé de
    // production, on vérifie que la marge est dans la plage autorisée par les
    // paramètres commerciaux globaux.
    const itemsWithProduction = parsedItems.filter(
      (item) => item.productionSummary,
    );
    if (itemsWithProduction.length > 0) {
      const commercialParams = await this.prisma.commercialParams.findFirst();
      if (!commercialParams) {
        throw new BadRequestException(
          'Les paramètres commerciaux ne sont pas configurés. Contactez un super administrateur.',
        );
      }
      for (const item of itemsWithProduction) {
        const margin = new Decimal(item.productionSummary.marginPercent);
        if (
          margin.lessThan(commercialParams.minMarginPercent) ||
          margin.greaterThan(commercialParams.maxMarginPercent)
        ) {
          throw new BadRequestException(
            `La marge de ${margin}% est hors de la plage autorisée ` +
              `(${commercialParams.minMarginPercent}% – ${commercialParams.maxMarginPercent}%).`,
          );
        }
      }
    }

    // Le prix de chaque ligne est celui saisi par le commercial (négocié via WhatsApp),
    // jamais dérivé du catalogue. La remise et le total sont figés ici, historiquement.
    let subtotal = new Decimal(0);
    const orderItemsData = parsedItems.map((item) => {
      if (!productMap.has(item.productId)) {
        throw new NotFoundException(
          `Produit avec l'ID ${item.productId} introuvable`,
        );
      }
      const unitPrice = new Decimal(item.unitPrice);
      const discount = new Decimal(item.discount ?? 0);
      const total = unitPrice.mul(item.quantity).sub(discount);
      subtotal = subtotal.add(total);
      return {
        ...item,
        unitPrice,
        discount,
        total,
        specSnapshot: formDefinitionByProductId.get(item.productId),
      };
    });

    const taxAmount = subtotal.mul(taxRate.rate);
    const totalAmount = subtotal.add(taxAmount);

    return this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          customerName,
          paymentDueDate: new Date(paymentDueDate),
          source,
          subtotal,
          taxAmount,
          totalAmount,
          taxRateValue: taxRate.rate,
          status: OrderStatus.PENDING_VALIDATION,
          paymentMethod: null, // Le mode de paiement sera défini lors de l'encaissement.
          productionStatus: ProductionStatus.PREPRESS,
          paymentStatus: PaymentStatus.UNPAID,
          amountPaid: 0,
          customerId,
          subsidiaryId: salesRepSubsidiaryId, // Filiale du commercial connecté
          taxRateId: taxRate.id,
          salesRepId,
          opportunityId,
          orderItems: {
            create: orderItemsData.map((item, index) => {
              const file = designFiles?.[index];
              return {
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discount: item.discount,
                total: item.total,
                specValues: item.specValues,
                specSnapshot: item.specSnapshot,
                designFileName: file?.originalname,
                designFileUrl: file
                  ? `/public/order_item_img/${file.filename}`
                  : undefined,
                productId: item.productId,
                productOptions: item.options
                  ? {
                      create: Object.entries(item.options).map(
                        ([optionType, optionValue]) => ({
                          optionType,
                          optionValue: String(optionValue),
                        }),
                      ),
                    }
                  : undefined,
              };
            }),
          },
          productionHistory: {
            create: { status: ProductionStatus.PREPRESS },
          },
        },
        include: {
          orderItems: true,
        },
      });

      // Création des enregistrements de coût de production figés.
      // L'ordre de newOrder.orderItems correspond à l'ordre d'insertion (parsedItems).
      for (let i = 0; i < parsedItems.length; i++) {
        const item = parsedItems[i];
        const orderItemId = newOrder.orderItems[i].id;

        if (item.productionSteps?.length) {
          await tx.orderItemProductionStep.createMany({
            data: item.productionSteps.map(
              (step: {
                equipmentId: string;
                equipmentNameSnapshot: string;
                stepOrder: number;
                estimatedTimeHours: number;
                hourlyRateSnapshot: number;
                calculatedCost: number;
              }) => ({
                orderItemId,
                equipmentId: step.equipmentId,
                equipmentNameSnapshot: step.equipmentNameSnapshot,
                stepOrder: step.stepOrder,
                estimatedTimeHours: new Decimal(step.estimatedTimeHours),
                hourlyRateSnapshot: new Decimal(step.hourlyRateSnapshot),
                calculatedCost: new Decimal(step.calculatedCost),
              }),
            ),
          });
        }

        if (item.productionSummary) {
          await tx.orderItemProductionSummary.create({
            data: {
              orderItemId,
              totalProductionCost: new Decimal(
                item.productionSummary.totalProductionCost,
              ),
              marginPercent: new Decimal(item.productionSummary.marginPercent),
              finalPrice: new Decimal(item.productionSummary.finalPrice),
            },
          });
        }
      }

      return newOrder;
    });
  }

  /**
   *
   * @param user // Utilisateur connecté
   * @param query // Paramètres de la requête
   * @returns // Liste des commandes
   */
  async findAll(user: any, query: FindAllOrdersDto) {
    const {
      customerId,
      productId,
      orderStatus,
      paymentStatus,
      period,
      startDate,
      endDate,
      subsidiaryId: querySubsidiaryId,
      salesRepId: querySalesRepId,
    } = query;

    const isSuperAdmin =
      user.role === 'SUPER_ADMIN' || user.userRole === 'SUPER_ADMIN';
    const where: Prisma.OrderWhereInput = isSuperAdmin
      ? querySubsidiaryId
        ? { subsidiaryId: querySubsidiaryId }
        : {}
      : { subsidiaryId: user.subsidiaryId };

    if (customerId) {
      where.customerId = customerId;
    }

    if (querySalesRepId) {
      where.salesRepId = querySalesRepId;
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
        dateFilter = {
          gte: startOfMonth(lastMonth),
          lte: endOfMonth(lastMonth),
        };
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
          throw new BadRequestException(
            'Pour une période personnalisée, les dates de début et de fin sont requises.',
          );
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
        orderItems: {
          include: {
            product: true,
            productOptions: true,
            productionSteps: { orderBy: { stepOrder: 'asc' } },
            productionSummary: true,
          },
        },
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
   * @param updateDto // DTO contenant le statut de la commande à mettre à jour
   * @param user // Utilisateur connecté
   * @returns // Commande mise à jour
   */
  async updateOrderStatus(
    id: string,
    updateDto: UpdateOrderStatusDto,
    user: any,
  ) {
    // Vérifier que la commande existe et appartient à la bonne filiale
    await this.findOne(id, user);

    return this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id },
        data: { status: updateDto.status },
      });

      return updatedOrder;
    });
  }

  /**
   *
   * @param id  ID de la commande
   * @param updateDto DTO contenant le statut de production a mettre a jour
   * @param user Utilisateur connecte
   * @returns Commande mise a jour
   */
  async updateProductionStatus(
    id: string,
    updateDto: updateProductionStatusDto,
    user: any,
  ) {
    await this.findOne(id, user);

    return this.prisma.$transaction(async (tx) => {
      const updateProduction = await tx.order.update({
        where: { id },
        data: { productionStatus: updateDto.productionStatus },
      });

      await tx.orderProductionHistory.create({
        data: {
          orderId: id,
          status: updateDto.productionStatus,
        },
      });

      return updateProduction;
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
   * @param user - Utilisateur connecté
   * @param query - Filtres optionnels (subsidiaryId, salesRepId)
   * @param limit - Nombre de produits à retourner
   */
  async getBestSellingProducts(
    user: any,
    query?: Pick<FindAllOrdersDto, 'subsidiaryId' | 'salesRepId'>,
    limit = 10,
  ) {
    const isSuperAdmin =
      user.role === 'SUPER_ADMIN' || user.userRole === 'SUPER_ADMIN';
    const effectiveSubsidiaryId = isSuperAdmin
      ? (query?.subsidiaryId ?? null)
      : user.subsidiaryId;

    const conditions: Prisma.Sql[] = [];
    if (effectiveSubsidiaryId) {
      conditions.push(
        Prisma.sql`AND o.subsidiary_id = ${effectiveSubsidiaryId}::uuid`,
      );
    }
    if (query?.salesRepId) {
      conditions.push(
        Prisma.sql`AND o.sales_rep_id = ${query.salesRepId}::uuid`,
      );
    }
    const extraConditions =
      conditions.length > 0
        ? Prisma.join(conditions, '\n      ')
        : Prisma.empty;

    const result: {
      product_id: string;
      product_name: string;
      total_quantity: number;
      total_revenue: number;
    }[] = await this.prisma.$queryRaw(Prisma.sql`
      SELECT
        p.id AS product_id,
        p.name AS product_name,
        SUM(oi.quantity)::float AS total_quantity,
        SUM(oi.quantity * oi.unit_price)::float AS total_revenue
      FROM "order_item" oi
      JOIN "items" p ON oi.product_id = p.id
      JOIN "orders" o ON oi.order_id = o.id
      WHERE o.status != 'CANCELLED'
        AND oi.product_id IS NOT NULL
        ${extraConditions}
      GROUP BY p.id, p.name
      ORDER BY total_revenue DESC
      LIMIT ${limit}
    `);

    return result.map((r) => ({
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
  async recordPayment(
    id: string,
    recordPaymentDto: RecordPaymentDto,
    user: any,
  ) {
    const { amount, paymentMethod } = recordPaymentDto;
    const paymentAmount = new Decimal(amount);

    return this.prisma.$transaction(async (tx) => {
      // 1. Récupérer la commande et vérifier les droits
      const order = await tx.order.findUnique({
        where: { id },
        include: { orderItems: { include: { product: true } }, customer: true },
      });

      if (!order) {
        throw new NotFoundException(`Commande avec l'ID "${id}" non trouvée.`);
      }

      // 2. Valider le paiement
      const newAmountPaid = order.amountPaid.add(paymentAmount);
      if (newAmountPaid.greaterThan(order.totalAmount)) {
        throw new BadRequestException(
          'Le montant payé ne peut pas dépasser le total de la commande.',
        );
      }

      const remainingBalance = order.totalAmount.sub(newAmountPaid);
      const newPaymentStatus = remainingBalance.isZero()
        ? PaymentStatus.PAID
        : PaymentStatus.PARTIALLY_PAID;

      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          amountPaid: newAmountPaid,
          paymentStatus: newPaymentStatus,
          paymentMethod: paymentMethod,
        },
        include: { orderItems: { include: { product: true } }, customer: true },
      });

      // 4. Si la commande est entièrement payée, créer les enregistrements de vente
      // (le stock de matières n'est jamais décrémenté automatiquement depuis une commande —
      // voir le flux manuel "Prélever les matières" du module Stock)
      if (newPaymentStatus === PaymentStatus.PAID) {
        const salesToCreate = updatedOrder.orderItems.map((item) => {
          if (!item.product) {
            // Ce cas ne devrait pas arriver si la base est cohérente, mais c'est une sécurité.
            throw new InternalServerErrorException(
              `Produit manquant pour l'article de commande ${item.id}`,
            );
          }
          return {
            productName: item.product.name,
            quantity: item.quantity,
            totalPrice: new Decimal(item.unitPrice).mul(item.quantity),
            saleDate: new Date(),
            customerName: updatedOrder.customer.contactName,
            taxRate: updatedOrder.taxRateValue,
            // Utilise le mode de paiement de la commande ou celui de l'encaissement
            paymentMethod: updatedOrder.paymentMethod || paymentMethod,
            customerId: updatedOrder.customerId,
            subsidiaryId: updatedOrder.subsidiaryId,
            salesRepId: updatedOrder.salesRepId,
            orderId: updatedOrder.id, // Lier la vente à la commande
            status: SaleStatus.PAID, // Le statut de la vente est directement 'PAID'
          };
        });

        await tx.sale.createMany({
          data: salesToCreate,
        });
      }

      return updatedOrder;
    });
  }

  /**
   * @param user connecte
   * @returns la liste des contacts/clients avec des credits
   */
  async getAllCustomerCredit(user: any) {
    const creditAccount = await this.prisma.creditAccount.findMany({
      where: { subsidiaryId: user.subsidiaryId },
    });
    return creditAccount;
  }

  /**
   * Récupère un compte de crédit client par son ID.
   * @param id ID du compte de crédit
   * @param user Utilisateur connecté
   * @returns Le compte de crédit trouvé
   */
  async getOneCustomerCredit(id: string, user: any) {
    const creditAccount = await this.prisma.creditAccount.findFirst({
      where: {
        id: id,
        subsidiaryId: user.subsidiaryId,
      },
    });

    if (!creditAccount) {
      throw new NotFoundException(
        `Compte de crédit avec l'ID "${id}" non trouvé.`,
      );
    }

    return creditAccount;
  }

  private get orderFullInclude() {
    return {
      customer: true,
      salesRep: true,
      taxRate: true,
      subsidiary: { select: { subsidiaryName: true } },
      orderItems: {
        include: {
          product: true,
          productOptions: true,
          productionSteps: { orderBy: { stepOrder: 'asc' } as const },
          productionSummary: true,
        },
      },
      productionHistory: { orderBy: { changeDate: 'asc' } as const },
    };
  }

  async validateForProduction(id: string, user: any) {
    const order = await this.prisma.order.findUnique({
      where: { id, subsidiaryId: user.subsidiaryId },
    });
    if (!order) {
      throw new NotFoundException(`Commande "${id}" introuvable.`);
    }
    if (order.status !== OrderStatus.PENDING_VALIDATION) {
      throw new BadRequestException(
        `La commande n'est pas en attente de validation (statut actuel : ${order.status}).`,
      );
    }
    return this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.IN_PRODUCTION },
      include: this.orderFullInclude,
    });
  }

  async rejectByProductionDirector(id: string, user: any) {
    const order = await this.prisma.order.findUnique({
      where: { id, subsidiaryId: user.subsidiaryId },
    });
    if (!order) {
      throw new NotFoundException(`Commande "${id}" introuvable.`);
    }
    if (order.status !== OrderStatus.PENDING_VALIDATION) {
      throw new BadRequestException(
        `Seules les commandes en attente de validation peuvent être rejetées.`,
      );
    }
    return this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED },
      include: this.orderFullInclude,
    });
  }

  async findPendingValidation(user: any, subsidiaryId?: string) {
    // Super Admin : vue consolidée toutes filiales (filtrage optionnel par filiale)
    const isSuperAdmin =
      user.userRole === 'SUPER_ADMIN' || user.activeRole === 'SUPER_ADMIN';
    const where: Prisma.OrderWhereInput = {
      status: OrderStatus.PENDING_VALIDATION,
      ...(isSuperAdmin
        ? subsidiaryId
          ? { subsidiaryId }
          : {}
        : { subsidiaryId: user.subsidiaryId }),
    };
    return this.prisma.order.findMany({
      where,
      include: this.orderFullInclude,
      orderBy: { orderDate: 'asc' },
    });
  }
}
