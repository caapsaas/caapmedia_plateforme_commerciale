import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';
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
  CustomerPaymentMethod,
  TransactionType,
  TransactionStatus,
} from '@prisma/client';
import { FindAllOrdersDto, OrderPeriod } from './dto/find-all-orders.dto';
import { paginate } from 'src/common/pagination/pagination';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';
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
import { OrderNotificationsService } from '../../notifications/order-notifications.service';
import { assertOrderTransition, BEFORE_PRODUCTION, nextOrderStatusForProduction } from './order-workflow';

// Allowlist shared by every order response, including raw Prisma responses.
const orderCustomerSelect = {
  id: true,
  contactName: true,
  company: true,
  email: true,
  phone: true,
  address: true,
  subsidiaryId: true,
} satisfies Prisma.ContactSelect;
const orderSalesRepSelect = {
  id: true,
  userName: true,
  email: true,
  subsidiaryId: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productSpecsService: ProductSpecsService,
    private readonly orderNotifications: OrderNotificationsService,
  ) {}

  // Fonction utilitaire pour mapper une commande à son format de réponse
  private mapOrderToResponse(order: any) {
    return {
      id: order.id,
      date: order.orderDate,
      orderDate: order.orderDate,
      customerName: order.customerName,
      customerId: order.customerId,
      customer: order.customer,
      salesRep: order.salesRep,
      subsidiary: order.subsidiary,
      subtotal: order.subtotal ? order.subtotal.toNumber() : 0,
      taxAmount: order.taxAmount ? order.taxAmount.toNumber() : 0,
      totalAmount: order.totalAmount ? order.totalAmount.toNumber() : 0,
      amountPaid: order.amountPaid ? order.amountPaid.toNumber() : 0,
      paymentDueDate: order.paymentDueDate,
      taxRateId: order.taxRateId,
      taxRateValue: order.taxRateValue ? order.taxRateValue.toNumber() : 0,
      applyTax: order.applyTax,
      status: order.status,
      productionStatus: order.productionStatus,
      paymentStatus: order.paymentStatus,
      productionHistory: order.productionHistory ?? [],
      orderItems: (order.orderItems ?? []).map((item: any) => ({
        id: item.id,
        productName: item.product?.name ?? item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice ? item.unitPrice.toNumber() : 0,
        discount: item.discount ? item.discount.toNumber() : 0,
        assemblyPrice: item.assemblyPrice
          ? item.assemblyPrice.toNumber()
          : null,
        total: item.total ? item.total.toNumber() : 0,
        designFileName: item.designFileName,
        designFileUrl: item.designFileUrl,
        productId: item.productId,
        orderId: item.orderId,
        product: item.product,
        productOptions: item.productOptions ?? [],
        specValues: item.specValues,
        specSnapshot: item.specSnapshot,
        productionSteps: item.productionSteps ?? [],
        productionSummary: item.productionSummary ?? null,
      })),
    };
  }

  // updateCustomerCredit (compte crédit dédié par contact) a été retirée :
  // jamais appelée (dead code), et faisait doublon avec la véritable source
  // de vérité des créances clients — Order.paymentStatus/amountPaid (voir
  // CreditManagement.tsx côté frontend, getCustomerReceivables côté
  // balancesheet.service.ts). Pas de solde à synchroniser séparément.

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
      applyTax = true,
    } = createOrderDto;

    // Le corps d'un formulaire multipart est toujours en string, il faut parser les items.
    const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;

    const { id: salesRepId, subsidiaryId: salesRepSubsidiaryId } = user;

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
    const distinctProductIds = [...new Set<string>(productIds)];

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

    if (products.length !== distinctProductIds.length) {
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

    // Les marges configurées sont indicatives et ne bloquent pas les commandes.

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
      const assemblyPrice =
        item.assemblyPrice != null ? new Decimal(item.assemblyPrice) : null;
      const total = unitPrice
        .mul(item.quantity)
        .sub(discount)
        .add(assemblyPrice ?? 0);
      subtotal = subtotal.add(total);
      return {
        ...item,
        unitPrice,
        discount,
        assemblyPrice,
        total,
        specSnapshot: formDefinitionByProductId.get(item.productId),
      };
    });

    // La TVA est optionnelle à la création : on garde toujours la référence au
    // taux configuré par défaut (taxRateId/taxRateValue), mais le montant
    // effectivement prélevé est nul si le commercial a décoché son application.
    const effectiveTaxRate = applyTax ? taxRate.rate : new Decimal(0);
    const taxAmount = subtotal.mul(effectiveTaxRate);
    const totalAmount = subtotal.add(taxAmount);

    const createdOrder = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          id: generateId(ID_PREFIXES.ORDER),
          customerName,
          paymentDueDate: new Date(paymentDueDate),
          source,
          subtotal,
          taxAmount,
          totalAmount,
          taxRateValue: effectiveTaxRate,
          applyTax,
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
            create: orderItemsData.map(
              (
                item,
                index,
              ): Prisma.OrderItemUncheckedCreateWithoutOrderInput => {
                const file = designFiles?.[index];
                return {
                  id: generateId(ID_PREFIXES.ORDERITEM),
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  discount: item.discount,
                  assemblyPrice: item.assemblyPrice,
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
                        create: item.options.map((option) => ({
                          id: generateId(ID_PREFIXES.PRODUCTOPTION),
                          optionType: option.optionType,
                          optionValue: option.optionValue,
                        })),
                      }
                    : undefined,
                };
              },
            ),
          },
          productionHistory: {
            create: {
              id: generateId(ID_PREFIXES.ORDERPRODUCTIONHISTORY),
              status: ProductionStatus.PREPRESS,
            },
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
                id: generateId(ID_PREFIXES.ORDERITEMPRODUCTIONSTEP),
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
              id: generateId(ID_PREFIXES.ORDERITEMPRODUCTIONSUMMARY),
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
    await this.orderNotifications.created(createdOrder);
    return createdOrder;
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

    // Appliquer les filtres uniquement s'ils ont une valeur non-vide
    if (customerId && customerId.trim()) {
      where.customerId = customerId;
    }

    if (querySalesRepId) {
      where.salesRepId = querySalesRepId;
    }

    if (productId) {
      where.orderItems = { some: { productId } };
    }

    if (orderStatus && orderStatus.trim()) {
      where.status = orderStatus as any;
    }

    if (paymentStatus && paymentStatus.trim()) {
      where.paymentStatus = paymentStatus as any;
    }

    // Appliquer le filtre de période
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
        const parsedStartDate = new Date(startDate);
        const parsedEndDate = new Date(endDate);

        if (
          isNaN(parsedStartDate.getTime()) ||
          isNaN(parsedEndDate.getTime())
        ) {
          throw new BadRequestException(
            'Les dates fournies ne sont pas au bon format.',
          );
        }

        dateFilter = { gte: parsedStartDate, lte: parsedEndDate };
      }
      where.orderDate = dateFilter;
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        customer: { select: orderCustomerSelect },
        salesRep: { select: orderSalesRepSelect },
        orderItems: { include: { product: true } },
      },
      orderBy: { orderDate: 'desc' },
      // Filet de sécurité : endpoint consommé par ~10 vues (POS, CRM, finance,
      // production) qui ont besoin du jeu de données filtré complet (totaux,
      // exports) plutôt que d'une pagination cliquable. Ce plafond évite juste
      // une requête littéralement non bornée en production.
      take: 2000,
    });

    return orders.map((order) => this.mapOrderToResponse(order));
  }

  /**
   *
   * @param id // ID de la commande
   * @param user // Utilisateur connecté
   * @returns // Commande trouvée
   */
  async findOneForCustomer(id: string, contact: { id: string }) {
    const order = await this.prisma.order.findUnique({
      where: { id, customerId: contact.id },
      include: this.orderFullInclude,
    });
    if (!order) {
      throw new NotFoundException(`Commande avec l'ID "${id}" non trouvée.`);
    }
    return this.mapOrderToResponse(order);
  }

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
        customer: { select: orderCustomerSelect },
        salesRep: { select: orderSalesRepSelect },
        taxRate: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Commande avec l'ID "${id}" non trouvée.`);
    }

    return this.mapOrderToResponse(order);
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
    if (!user.subsidiaryId) throw new ForbiddenException('Filiale requise.');
    // Vérifier que la commande existe et appartient à la bonne filiale
    const order = await this.prisma.order.findUnique({
      where: { id, subsidiaryId: user.subsidiaryId },
    });

    if (!order) {
      throw new NotFoundException(`Commande avec l'ID "${id}" non trouvée.`);
    }

    assertOrderTransition(order, updateDto.status, user);
    if (order.status === updateDto.status) return this.mapOrderToResponse(order);

    return this.prisma
      .$transaction(async (tx) => {
        const updatedOrder = await tx.order.update({
          where: {
            id, subsidiaryId: user.subsidiaryId, status: order.status,
            productionStatus: order.productionStatus,
            amountPaid: order.amountPaid, paymentStatus: order.paymentStatus,
          },
          data: { status: updateDto.status },
          include: this.orderFullInclude,
        });

        return this.mapOrderToResponse(updatedOrder);
      })
      .catch((error: unknown) => this.handleStatusConflict(error))
      .then(async (updated) => {
        await this.orderNotifications.statusChanged(
          order,
          updateDto.status,
          order.status,
        );
        return updated;
      });
  }

  private handleStatusConflict(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      throw new ConflictException(
        'Le statut de cette commande a changé. Actualisez la liste avant de réessayer.',
      );
    }
    throw error;
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
    if (!user.subsidiaryId) throw new ForbiddenException('Filiale requise.');
    const order = await this.prisma.order.findUnique({ where: { id, subsidiaryId: user.subsidiaryId } });
    if (!order) throw new NotFoundException(`Commande "${id}" introuvable.`);
    const nextStatus = nextOrderStatusForProduction(order, updateDto.productionStatus, user);

    const updated = await this.prisma.$transaction(async (tx) => {
      const updateProduction = await tx.order.update({
        where: { id, subsidiaryId: user.subsidiaryId, status: order.status, productionStatus: order.productionStatus },
        data: { productionStatus: updateDto.productionStatus, status: nextStatus },
      });

      await tx.orderProductionHistory.create({
        data: {
          id: generateId(ID_PREFIXES.ORDERPRODUCTIONHISTORY),
          orderId: id,
          status: updateDto.productionStatus,
        },
      });

      return updateProduction;
    }).catch((error: unknown) => this.handleStatusConflict(error));
    if (order.productionStatus !== updateDto.productionStatus) {
      await this.orderNotifications.productionChanged(
        updated,
        updateDto.productionStatus,
      );
    }
    return updated;
  }

  /**
   *
   * @param customerId // ID du client
   * @returns // Liste des commandes du client
   */
  async findGroupsByCustomer(customerId: string, contact: { id: string }) {
    if (customerId !== contact.id) {
      throw new ForbiddenException(
        'Accès aux commandes de ce client interdit.',
      );
    }
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
        Prisma.sql`AND o.subsidiary_id = ${effectiveSubsidiaryId}`,
      );
    }
    if (query?.salesRepId) {
      conditions.push(Prisma.sql`AND o.sales_rep_id = ${query.salesRepId}`);
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
  async findPaymentAccounts(user: { subsidiaryId?: string }) {
    if (!user.subsidiaryId) {
      throw new ForbiddenException(
        'Filiale requise pour enregistrer un paiement.',
      );
    }
    return this.prisma.treasuryAccount.findMany({
      where: { subsidiaryId: user.subsidiaryId, accountType: 'BANQUE' },
      select: { id: true, accountName: true },
      orderBy: { accountName: 'asc' },
    });
  }

  async recordPayment(
    id: string,
    recordPaymentDto: RecordPaymentDto,
    user: any,
  ) {
    const { amount, paymentMethod, bankAccountId, transactionReference } =
      recordPaymentDto;

    const BANKING_METHODS: CustomerPaymentMethod[] = [
      CustomerPaymentMethod.BANK_TRANSFER,
      CustomerPaymentMethod.CARD,
      CustomerPaymentMethod.CHECK,
    ];
    const isBankingPayment = BANKING_METHODS.includes(paymentMethod);

    if (isBankingPayment && !bankAccountId) {
      throw new BadRequestException(
        'Un compte bancaire doit être sélectionné pour ce mode de paiement.',
      );
    }
    const paymentAmount = new Decimal(amount);

    const payment = await this.prisma.$transaction(async (tx) => {
      // Fail closed: a staff identity must carry a subsidiary scope.
      if (!user.subsidiaryId) {
        throw new ForbiddenException(
          'Filiale requise pour enregistrer un paiement.',
        );
      }
      // 1. Récupérer uniquement une commande de la filiale de l'utilisateur.
      const order = await tx.order.findUnique({
        where: { id, subsidiaryId: user.subsidiaryId },
        include: {
          orderItems: { include: { product: true } },
          customer: { select: orderCustomerSelect },
        },
      });

      if (!order) {
        throw new NotFoundException(`Commande avec l'ID "${id}" non trouvée.`);
      }

      // Empêcher le paiement d'une commande annulée
      if (order.status === 'CANCELLED') {
        throw new ConflictException(
          "Le paiement d'une commande annulée n'est pas autorisé.",
        );
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

      // Utiliser updateMany avec verrou optimiste pour éviter les race conditions
      const updateCount = await tx.order.updateMany({
        where: {
          id,
          subsidiaryId: user.subsidiaryId,
          status: order.status,
          amountPaid: order.amountPaid, // Vérifier que amountPaid n'a pas changé
          paymentStatus: order.paymentStatus, // Vérifier que paymentStatus n'a pas changé
        },
        data: {
          amountPaid: newAmountPaid,
          paymentStatus: newPaymentStatus,
          paymentMethod: paymentMethod,
        },
      });

      // Si l'update a échoué (count === 0), la commande a été modifiée par une autre requête
      if (updateCount.count === 0) {
        throw new ConflictException(
          'Cette commande a été modifiée entre-temps. Veuillez réessayer.',
        );
      }

      // 3. Pour les paiements bancaires : créer une FinancialTransaction EN_ATTENTE de validation par le SUPER_ADMIN
      if (isBankingPayment && bankAccountId) {
        const bankAccount = await tx.treasuryAccount.findFirst({
          where: {
            id: bankAccountId,
            subsidiaryId: order.subsidiaryId,
            accountType: 'BANQUE',
          },
        });
        if (!bankAccount) {
          throw new NotFoundException(
            `Compte bancaire ${bankAccountId} introuvable pour cette filiale.`,
          );
        }

        await tx.financialTransaction.create({
          data: {
            transactionDate: new Date(),
            description: `Encaissement ${paymentMethod} — Commande ${order.id} — ${order.customer?.contactName || ''}`,
            amount: paymentAmount,
            relatedDocumentId: order.id,
            subsidiaryId: order.subsidiaryId,
            financialTransactionType: TransactionType.RECETTE,
            treasuryAccountId: bankAccountId,
            status: TransactionStatus.EN_ATTENTE,
            reference: transactionReference || null,
          },
        });
      }

      // Re-récupérer la commande mise à jour
      const updatedOrder = await tx.order.findUniqueOrThrow({
        where: { id },
        include: {
          orderItems: { include: { product: true } },
          customer: { select: orderCustomerSelect },
        },
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
            id: generateId(ID_PREFIXES.SALE),
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

      // Re-fetch with all necessary relations for mapping
      const finalOrder = await tx.order.findUniqueOrThrow({
        where: { id },
        include: {
          orderItems: { include: { product: true } },
          customer: { select: orderCustomerSelect },
          salesRep: { select: orderSalesRepSelect },
        },
      });

      return this.mapOrderToResponse(finalOrder);
    });
    const reference = { id, subsidiaryId: user.subsidiaryId };
    await this.orderNotifications.paymentReceived(reference);
    return payment;
  }

  // getAllCustomerCredit / getOneCustomerCredit (endpoints /orders/credit)
  // retirées : jamais appelées par le frontend (mort), et lisaient le même
  // compte crédit jamais alimenté (voir updateCustomerCredit ci-dessus).
  // Les créances clients se consultent via GET /ecommerce/orders avec les
  // filtres paymentStatus (voir CreditManagement.tsx).

  private get orderFullInclude() {
    return {
      customer: { select: orderCustomerSelect },
      salesRep: { select: orderSalesRepSelect },
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
    return this.updateOrderStatus(id, { status: OrderStatus.IN_PRODUCTION }, user);
  }

  async rejectByProductionDirector(id: string, user: any) {
    return this.updateOrderStatus(id, { status: OrderStatus.CANCELLED }, user);
  }

  async findPendingValidation(
    user: any,
    subsidiaryId?: string,
    paginationQuery: PaginationQueryDto = {},
  ) {
    // Super Admin : vue consolidée toutes filiales (filtrage optionnel par filiale)
    const isSuperAdmin =
      user.userRole === 'SUPER_ADMIN' || user.activeRole === 'SUPER_ADMIN';
    const where: Prisma.OrderWhereInput = {
      status: { in: BEFORE_PRODUCTION },
      ...(isSuperAdmin
        ? subsidiaryId
          ? { subsidiaryId }
          : {}
        : { subsidiaryId: user.subsidiaryId }),
    };
    return paginate(
      this.prisma.order,
      {
        where,
        include: this.orderFullInclude,
        orderBy: { orderDate: 'asc' },
      },
      paginationQuery,
    );
  }
}
