import { EntriesService } from '../../accounting/entries/entries.service';
import { creditCashRegister } from '../credit-cash-register';
import {
  getActiveRole,
  isSuperAdmin,
  type RoleIdentity,
} from '../../common/auth/role/role-identity';
import {
  resolveScopeContext,
  withSubsidiaryScope,
} from '../../common/utils/subsidiary-scope';
import type { JwtUser } from '../../common/auth/jwt/jwt-user.interface';
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
  CashRemittanceStatus,
  JournalEntryStatus,
  NotificationType,
  Order,
  PaymentStatus,
  Prisma,
  ProductionStatus,
  SaleStatus,
  ItemType,
  CustomerPaymentMethod,
  TransactionType,
  TransactionStatus,
  UserRole,
} from '@prisma/client';
import { FindAllOrdersDto, OrderPeriod } from './dto/find-all-orders.dto';
import { paginate } from 'src/common/pagination/pagination';
import {
  endOfDateInput,
  lastCalendarDays,
  startOfDateInput,
} from 'src/common/utils/date-period.util';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';
import {
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
} from 'date-fns';
import { Decimal } from '@prisma/client/runtime/library';
import { ProductSpecsService } from '../products/product-specs/product-specs.service';
import { OrderNotificationsService } from '../../notifications/order-notifications.service';
import {
  assertOrderTransition,
  assertWorkflowRole,
  BEFORE_PRODUCTION,
  DELIVERY_ROLES,
  nextOrderStatusForProduction,
} from './order-workflow';

type RecordedDelivery = {
  id: string;
  deliveredOn: string;
  lines: {
    orderItemId: string;
    deliveredQuantity: number;
    packageCount: number;
    productName: string;
    orderedQuantity: number;
  }[];
};

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
    private readonly entries: EntriesService,
  ) {}

  // Fonction utilitaire pour mapper une commande à son format de réponse
  private mapOrderToResponse(
    order: any,
    audience: 'staff' | 'customer' = 'staff',
  ) {
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
      ...(audience === 'staff'
        ? {
            cancellationReason:
              (order as Pick<Order, 'cancellationReason'>).cancellationReason ??
              null,
          }
        : {}),
      productionStatus: order.productionStatus,
      paymentStatus: order.paymentStatus,
      paymentMethod:
        (order as { paymentMethod?: CustomerPaymentMethod | null })
          .paymentMethod ?? null,
      productionHistory: order.productionHistory ?? [],
      deliveries:
        (order as { deliveries?: RecordedDelivery[] }).deliveries ?? [],
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
      occasionalCustomer,
    } = createOrderDto;

    if (Boolean(customerId?.trim()) === Boolean(occasionalCustomer)) {
      throw new BadRequestException(
        'Sélectionnez un client existant ou renseignez un client occasionnel.',
      );
    }
    if (occasionalCustomer && opportunityId) {
      throw new BadRequestException(
        'Une opportunité existante nécessite un client existant.',
      );
    }
    if (!user.subsidiaryId) {
      throw new BadRequestException(
        'Une filiale est requise pour créer une commande.',
      );
    }

    // Le corps d'un formulaire multipart est toujours en string, il faut parser les items.
    const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;

    if ((designFiles?.length ?? 0) > (parsedItems?.length ?? 0)) {
      throw new BadRequestException(
        'Un fichier de conception au maximum par article.',
      );
    }

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

    const [products, taxRate] = await Promise.all([
      this.prisma.item.findMany({
        where: { id: { in: productIds }, type: ItemType.SERVICE },
      }),
      this.prisma.taxRate.findFirstOrThrow({ where: { isDefault: true } }),
      customerId
        ? this.prisma.contact.findUniqueOrThrow({ where: { id: customerId } })
        : Promise.resolve(null),
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
      let effectiveCustomerId = customerId;
      if (occasionalCustomer) {
        if (occasionalCustomer.email) {
          const existing = await tx.contact.findUnique({
            where: { email: occasionalCustomer.email },
          });
          if (existing) {
            throw new ConflictException(
              'Un client utilise déjà cet email. Sélectionnez sa fiche existante.',
            );
          }
        }
        const contact = await tx.contact.create({
          data: {
            id: generateId(ID_PREFIXES.CONTACT),
            contactName: occasionalCustomer.name,
            phone: occasionalCustomer.phone,
            email: occasionalCustomer.email ?? null,
            company: '',
            address: '',
            since: new Date(),
            subsidiaryId: salesRepSubsidiaryId,
            salesRepId,
            isOccasional: true,
            isVerified: false,
          },
        });
        effectiveCustomerId = contact.id;
      }
      const newOrder = await tx.order.create({
        data: {
          id: generateId(ID_PREFIXES.ORDER),
          customerName: occasionalCustomer?.name ?? customerName,
          paymentDueDate: new Date(paymentDueDate),
          source,
          subtotal,
          taxAmount,
          totalAmount,
          taxRateValue: effectiveTaxRate,
          applyTax,
          status: OrderStatus.PENDING_VALIDATION,
          paymentMethod: createOrderDto.paymentMethod,
          productionStatus: ProductionStatus.PREPRESS,
          paymentStatus: PaymentStatus.UNPAID,
          amountPaid: 0,
          customerId: effectiveCustomerId!,
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
          orderItems: { include: { product: true } },
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
    return this.mapOrderToResponse(createdOrder);
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
      where.paymentStatus = paymentStatus as PaymentStatus;
      if (!orderStatus?.trim()) where.status = { not: OrderStatus.CANCELLED };
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
        dateFilter = lastCalendarDays(now, 7);
      } else if (period === OrderPeriod.LAST_30_DAYS) {
        dateFilter = lastCalendarDays(now, 30);
      } else if (period === OrderPeriod.LAST_90_DAYS) {
        dateFilter = lastCalendarDays(now, 90);
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

        dateFilter = {
          gte: startOfDateInput(startDate),
          lte: endOfDateInput(endDate),
        };
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
    return this.mapOrderToResponse(order, 'customer');
  }

  async findOne(id: string, user: JwtUser) {
    const order = await this.prisma.order.findUnique({
      where: withSubsidiaryScope(
        {
          id,
          ...(getActiveRole(user) === UserRole.COMMERCIAL
            ? { salesRepId: user.id }
            : {}),
        },
        resolveScopeContext(user),
      ),
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
    user: RoleIdentity & { id?: string; subsidiaryId?: string },
  ) {
    if (!user.subsidiaryId) throw new ForbiddenException('Filiale requise.');
    // Vérifier que la commande existe et appartient à la bonne filiale
    const order = await this.prisma.order.findUnique({
      where: { id, subsidiaryId: user.subsidiaryId },
      include: this.orderFullInclude,
    });

    if (!order) {
      throw new NotFoundException(`Commande avec l'ID "${id}" non trouvée.`);
    }

    if (updateDto.status === OrderStatus.CANCELLED) {
      assertWorkflowRole(user, DELIVERY_ROLES);
      const reason =
        typeof updateDto.cancellationReason === 'string'
          ? updateDto.cancellationReason.trim()
          : '';
      if (!reason || reason.length > 1000 || updateDto.delivery) {
        throw new BadRequestException(
          'Renseignez un motif d’annulation de 1 à 1 000 caractères.',
        );
      }
      if (order.status === OrderStatus.CANCELLED)
        return this.mapOrderToResponse(order);
      return this.cancelOrder(order, reason, user.id);
    }

    const delivery = updateDto.delivery;
    const deliveries = (order.deliveries ??
      []) as unknown as RecordedDelivery[];
    if (delivery) {
      assertWorkflowRole(user, DELIVERY_ROLES);
      if (updateDto.status !== OrderStatus.DELIVERED) {
        throw new BadRequestException(
          'Les détails de livraison nécessitent une confirmation de livraison.',
        );
      }
      if (deliveries.some((record) => record.id === delivery.id)) {
        return this.mapOrderToResponse(order);
      }
      if (order.status !== OrderStatus.PENDING_DELIVERY) {
        throw new ConflictException(
          'Cette commande n’est plus en attente de livraison.',
        );
      }
    }
    assertOrderTransition(order, updateDto.status, user);
    if (order.status === updateDto.status)
      return this.mapOrderToResponse(order);

    let nextStatus = updateDto.status;
    let recordedDelivery: RecordedDelivery | undefined;
    if (nextStatus === OrderStatus.DELIVERED) {
      if (!delivery) {
        throw new BadRequestException(
          'Renseignez les détails de la livraison.',
        );
      }
      const today = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'Africa/Douala',
      }).format(new Date());
      if (delivery.deliveredOn > today) {
        throw new BadRequestException(
          'La date de livraison ne peut pas être future.',
        );
      }
      const items = order.orderItems ?? [];
      const byId = new Map(items.map((item) => [item.id, item]));
      const deliveredByItem = new Map<string, number>();
      for (const record of deliveries) {
        for (const line of record.lines) {
          deliveredByItem.set(
            line.orderItemId,
            (deliveredByItem.get(line.orderItemId) ?? 0) +
              line.deliveredQuantity,
          );
        }
      }
      const seen = new Set<string>();
      const lines = delivery.lines.map((line) => {
        const item = byId.get(line.orderItemId);
        const total =
          (deliveredByItem.get(line.orderItemId) ?? 0) + line.deliveredQuantity;
        if (!item || seen.has(line.orderItemId) || total > item.quantity) {
          throw new BadRequestException(
            'Une ligne de livraison est invalide ou dépasse le reliquat de la commande.',
          );
        }
        seen.add(line.orderItemId);
        deliveredByItem.set(line.orderItemId, total);
        return {
          ...line,
          productName: item.product?.name ?? item.id,
          orderedQuantity: item.quantity,
        };
      });
      recordedDelivery = {
        id: delivery.id,
        deliveredOn: delivery.deliveredOn,
        lines,
      };
      if (
        items.some(
          (item) => (deliveredByItem.get(item.id) ?? 0) < item.quantity,
        )
      ) {
        nextStatus = OrderStatus.PENDING_DELIVERY;
      }
    }

    return this.prisma
      .$transaction(async (tx) => {
        const updatedOrder = await tx.order.update({
          where: {
            id,
            subsidiaryId: user.subsidiaryId,
            status: order.status,
            productionStatus: order.productionStatus,
            amountPaid: order.amountPaid,
            paymentStatus: order.paymentStatus,
            ...(recordedDelivery
              ? {
                  deliveries: {
                    equals:
                      order.deliveries === null
                        ? Prisma.DbNull
                        : (order.deliveries as Prisma.InputJsonValue),
                  },
                }
              : {}),
          },
          data: {
            status: nextStatus,
            ...(recordedDelivery
              ? { deliveries: [...deliveries, recordedDelivery] }
              : {}),
          },
          include: this.orderFullInclude,
        });

        return this.mapOrderToResponse(updatedOrder);
      })
      .catch((error: unknown) => this.handleStatusConflict(error))
      .then(async (updated) => {
        if (nextStatus !== order.status) {
          await this.orderNotifications.statusChanged(
            order,
            nextStatus,
            order.status,
          );
        }
        return updated;
      });
  }

  private async cancelOrder(order: Order, reason: string, userId?: string) {
    const { id, subsidiaryId } = order;
    const updated = await this.prisma
      .$transaction(
        async (tx) => {
          const cancelled = await tx.order.update({
            where: {
              id,
              subsidiaryId,
              status: order.status,
              amountPaid: order.amountPaid,
              paymentStatus: order.paymentStatus,
            },
            data: {
              status: OrderStatus.CANCELLED,
              cancellationReason: reason,
              amountPaid: 0,
              paymentStatus: PaymentStatus.UNPAID,
              paymentMethod: null,
            },
            include: this.orderFullInclude,
          });

          const receipts = await tx.financialTransaction.findMany({
            where: {
              subsidiaryId,
              relatedDocumentId: id,
              financialTransactionType: TransactionType.RECETTE,
            },
            include: {
              cashRemittanceReceipts: { include: { cashRemittance: true } },
            },
          });
          const receiptIds = receipts.map((receipt) => receipt.id);
          const sales = await tx.sale.findMany({
            where: { subsidiaryId, orderId: id },
            select: { id: true },
          });
          const sources = [
            { sourceType: 'TREASURY_INCOME', ids: receiptIds },
            { sourceType: 'SALE_PAID', ids: sales.map((sale) => sale.id) },
          ];
          for (const { sourceType, ids } of sources) {
            if (ids.length === 0) continue;
            await tx.accountingOutboxEntry.deleteMany({
              where: {
                subsidiaryId,
                eventType: sourceType,
                OR: ids.map((sourceId) => ({
                  payload: { path: ['sourceId'], equals: sourceId },
                })),
              },
            });
            const entries = await tx.journalEntry.findMany({
              where: { subsidiaryId, sourceType, sourceId: { in: ids } },
              include: { lines: true },
            });
            for (const entry of entries) {
              if (
                entry.status === JournalEntryStatus.POSTED ||
                entry.sequentialNumber
              ) {
                await this.entries.reversePostedEntry(tx, entry, userId, true);
              } else {
                await tx.journalEntry.delete({ where: { id: entry.id } });
              }
            }
          }

          const pendingReceiptIds = receipts
            .filter((receipt) => receipt.status !== TransactionStatus.VALIDE)
            .map((receipt) => receipt.id);
          if (pendingReceiptIds.length) {
            await tx.financialTransaction.deleteMany({
              where: { subsidiaryId, id: { in: pendingReceiptIds } },
            });
          }

          const legacyLink = receipts.some(
            (receipt) => receipt.status === TransactionStatus.VALIDE,
          )
            ? await tx.cashRemittanceOrder.findUnique({
                where: { orderId: id },
                include: { cashRemittance: true },
              })
            : null;
          const pendingRemittances = new Map<
            string,
            { amount: Decimal; declared: Decimal; receiptIds: string[] }
          >();
          let lastDebitTime = 0;
          for (const receipt of receipts) {
            if (receipt.status !== TransactionStatus.VALIDE) continue;
            const linkedRemittance =
              receipt.cashRemittanceReceipts[0]?.cashRemittance ??
              legacyLink?.cashRemittance;
            const remittance =
              linkedRemittance?.subsidiaryId === subsidiaryId &&
              linkedRemittance.sourceCashRegisterId ===
                receipt.treasuryAccountId
                ? linkedRemittance
                : undefined;
            if (remittance?.status === CashRemittanceStatus.SUBMITTED) {
              const pending = pendingRemittances.get(remittance.id) ?? {
                amount: new Decimal(0),
                declared: remittance.declaredAmount,
                receiptIds: [],
              };
              pending.amount = pending.amount.plus(receipt.amount);
              pending.receiptIds.push(receipt.id);
              pendingRemittances.set(remittance.id, pending);
            }
            // Le transfert vers le coffre est comptabilisé à la réception.
            const movedToSafe =
              remittance?.status === CashRemittanceStatus.RECEIVED ||
              remittance?.status ===
                CashRemittanceStatus.RECEIVED_WITH_DISCREPANCY;
            const accountId = movedToSafe
              ? remittance.destinationSafeId
              : receipt.treasuryAccountId;
            const account = await tx.treasuryAccount.update({
              where: { id: accountId, subsidiaryId },
              data: { balance: { decrement: receipt.amount } },
              select: { balance: true },
            });

            // Les débits successifs doivent être triés dans l’ordre des soldes.
            lastDebitTime = Math.max(Date.now(), lastDebitTime + 1);
            await tx.financialTransaction.create({
              data: {
                transactionDate: new Date(lastDebitTime),
                description: `Annulation du paiement — Commande ${id} — ${reason}`,
                amount: receipt.amount,
                financialTransactionType: TransactionType.DEPENSE,
                status: TransactionStatus.VALIDE,
                relatedDocumentId: id,
                subsidiaryId,
                treasuryAccountId: accountId,
                sourceAccountId: accountId,
                createdByUserId: userId,
                reference: `ORDER-CANCEL:${receipt.id}`,
                balanceAfterSource: account.balance,
              },
            });
          }

          for (const [remittanceId, pending] of pendingRemittances) {
            const remaining = Decimal.max(
              0,
              pending.declared.minus(pending.amount),
            );
            await tx.cashRemittance.update({
              where: {
                id: remittanceId,
                subsidiaryId,
                status: CashRemittanceStatus.SUBMITTED,
              },
              data: {
                declaredAmount: remaining,
                ...(remaining.isZero()
                  ? { status: CashRemittanceStatus.REJECTED }
                  : {}),
              },
            });
            await tx.cashRemittanceReceipt.deleteMany({
              where: {
                cashRemittanceId: remittanceId,
                financialTransactionId: { in: pending.receiptIds },
              },
            });
            if (legacyLink?.cashRemittance.id === remittanceId) {
              await tx.cashRemittanceOrder.deleteMany({
                where: { orderId: id, cashRemittanceId: remittanceId },
              });
            }
          }

          await tx.sale.deleteMany({ where: { subsidiaryId, orderId: id } });
          await tx.notification.deleteMany({
            where: { orderId: id, type: NotificationType.PAYMENT_RECEIVED },
          });
          return this.mapOrderToResponse(cancelled);
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      )
      .catch((error: unknown) => this.handleStatusConflict(error));

    await this.orderNotifications.statusChanged(
      order,
      OrderStatus.CANCELLED,
      order.status,
    );
    return updated;
  }

  private handleStatusConflict(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      ['P2025', 'P2034'].includes(error.code)
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
    const order = await this.prisma.order.findUnique({
      where: { id, subsidiaryId: user.subsidiaryId },
    });
    if (!order) throw new NotFoundException(`Commande "${id}" introuvable.`);
    const nextStatus = nextOrderStatusForProduction(
      order,
      updateDto.productionStatus,
      user,
    );

    const updated = await this.prisma
      .$transaction(async (tx) => {
        const updateProduction = await tx.order.update({
          where: {
            id,
            subsidiaryId: user.subsidiaryId,
            status: order.status,
            productionStatus: order.productionStatus,
          },
          data: {
            productionStatus: updateDto.productionStatus,
            status: nextStatus,
          },
        });

        await tx.orderProductionHistory.create({
          data: {
            id: generateId(ID_PREFIXES.ORDERPRODUCTIONHISTORY),
            orderId: id,
            status: updateDto.productionStatus,
          },
        });

        return updateProduction;
      })
      .catch((error: unknown) => this.handleStatusConflict(error));
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
      orders: group.orders.map((order) =>
        this.mapOrderToResponse(order, 'customer'),
      ),
    }));

    // 4. Créer des "groupes synthétiques" pour les commandes uniques
    const singleOrderGroups = singleOrders.map((order) => ({
      groupId: order.id, // Utiliser l'ID de la commande comme ID de groupe
      groupCode: `ORD-${order.id.substring(0, 8)}`, // Créer un code de groupe synthétique
      totalAmount: order.totalAmount.toNumber(),
      createdAt: order.orderDate,
      orders: [this.mapOrderToResponse(order, 'customer')], // La commande est la seule de son "groupe"
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
  async findPaymentAccounts(user: { id: string; subsidiaryId?: string }) {
    if (!user.subsidiaryId) {
      throw new ForbiddenException(
        'Filiale requise pour enregistrer un paiement.',
      );
    }
    return this.prisma.treasuryAccount.findMany({
      where: {
        subsidiaryId: user.subsidiaryId,
        OR: [
          { accountType: 'BANQUE' },
          { accountType: 'CASH_REGISTER', cashierId: user.id },
        ],
      },
      select: { id: true, accountName: true, accountType: true },
      orderBy: { accountName: 'asc' },
    });
  }

  async getCashierDailyReceipts(
    user: JwtUser,
    date = new Date().toISOString().slice(0, 10),
  ) {
    const superAdminView = isSuperAdmin(user);
    if (!user.id || (!user.subsidiaryId && !superAdminView))
      throw new ForbiddenException('Filiale requise.');
    const start = new Date(`${date}T00:00:00.000Z`);
    if (
      Number.isNaN(start.getTime()) ||
      start.toISOString().slice(0, 10) !== date
    )
      throw new BadRequestException('Date invalide.');
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    const cashierIds = superAdminView
      ? (
          await this.prisma.user.findMany({
            where: {
              OR: [
                { userRole: UserRole.CAISSIER },
                { additionalRoles: { has: UserRole.CAISSIER } },
              ],
            },
            select: { id: true },
          })
        ).map((cashier) => cashier.id)
      : [user.id];
    const transactions = await this.prisma.financialTransaction.findMany({
      where: {
        createdByUserId: { in: cashierIds },
        ...(superAdminView ? {} : { subsidiaryId: user.subsidiaryId }),
        financialTransactionType: TransactionType.RECETTE,
        transactionDate: { gte: start, lt: end },
        treasuryAccount: { accountType: { in: ['CASH_REGISTER', 'BANQUE'] } },
      },
      select: {
        id: true,
        transactionDate: true,
        description: true,
        amount: true,
        status: true,
        treasuryAccount: { select: { accountName: true, accountType: true } },
      },
      orderBy: { transactionDate: 'desc' },
    });
    const total = transactions.reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0,
    );
    return { date, total, count: transactions.length, transactions };
  }

  async recordPayment(
    id: string,
    recordPaymentDto: RecordPaymentDto,
    user: any,
  ) {
    const {
      amount,
      paymentMethod: requestedPaymentMethod,
      bankAccountId,
      cashRegisterId,
      transactionReference,
    } = recordPaymentDto;

    const paymentAmount = new Decimal(amount);
    if (
      !paymentAmount.isFinite() ||
      paymentAmount.lt('0.01') ||
      paymentAmount.decimalPlaces() > 2
    ) {
      throw new BadRequestException(
        'Le montant doit être positif et comporter au plus deux décimales.',
      );
    }

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

      const orderMethod = order.paymentMethod;
      const isDeferredMethod =
        orderMethod === CustomerPaymentMethod.PAY_ON_DELIVERY ||
        orderMethod === CustomerPaymentMethod.CUSTOMER_CREDIT;
      if (
        orderMethod &&
        !isDeferredMethod &&
        requestedPaymentMethod !== orderMethod
      ) {
        throw new BadRequestException(
          'Le mode de paiement doit correspondre à celui de la commande.',
        );
      }

      const paymentMethod =
        orderMethod && !isDeferredMethod ? orderMethod : requestedPaymentMethod;
      if (
        paymentMethod === CustomerPaymentMethod.PAY_ON_DELIVERY ||
        paymentMethod === CustomerPaymentMethod.CUSTOMER_CREDIT
      ) {
        throw new BadRequestException(
          'Veuillez choisir le mode de règlement effectif.',
        );
      }

      const BANKING_METHODS: CustomerPaymentMethod[] = [
        CustomerPaymentMethod.BANK_TRANSFER,
        CustomerPaymentMethod.CARD,
        CustomerPaymentMethod.CHECK,
      ];
      const isBankingPayment = BANKING_METHODS.includes(paymentMethod);
      if (paymentMethod === CustomerPaymentMethod.CASH && !cashRegisterId) {
        throw new BadRequestException(
          'Une caisse doit être sélectionnée pour un paiement en espèces.',
        );
      }

      if (isBankingPayment && !bankAccountId) {
        throw new BadRequestException(
          'Un compte bancaire doit être sélectionné pour ce mode de paiement.',
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
          paymentMethod: orderMethod,
          paymentStatus: order.paymentStatus, // Vérifier que paymentStatus n'a pas changé
        },
        data: {
          amountPaid: newAmountPaid,
          paymentStatus: newPaymentStatus,
          paymentMethod: orderMethod ?? paymentMethod,
        },
      });

      // Si l'update a échoué (count === 0), la commande a été modifiée par une autre requête
      if (updateCount.count === 0) {
        throw new ConflictException(
          'Cette commande a été modifiée entre-temps. Veuillez réessayer.',
        );
      }

      if (paymentMethod === CustomerPaymentMethod.CASH && cashRegisterId) {
        await creditCashRegister(
          tx,
          user,
          cashRegisterId,
          order.id,
          paymentAmount,
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
            createdByUserId: user.id,
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
            paymentMethod,
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
    const reference = {
      id,
      subsidiaryId: user.subsidiaryId,
      ...(payment.salesRep?.id ? { salesRepId: payment.salesRep.id } : {}),
    };
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
    return this.updateOrderStatus(
      id,
      { status: OrderStatus.IN_PRODUCTION },
      user,
    );
  }

  async rejectByProductionDirector(
    id: string,
    cancellationReason: string,
    user: RoleIdentity & { id?: string; subsidiaryId?: string },
  ) {
    return this.updateOrderStatus(
      id,
      { status: OrderStatus.CANCELLED, cancellationReason },
      user,
    );
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
