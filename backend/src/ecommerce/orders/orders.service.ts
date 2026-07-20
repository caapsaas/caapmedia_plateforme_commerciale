import { BadRequestException, Injectable, NotFoundException, InternalServerErrorException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { CreateOrderDto, CreateOrderBySalesRepDto, RecordPaymentDto, UpdateOrderStatusDto, updateProductionStatusDto } from './dto/create-order.dto';
import { Order, OrderGroup, OrderStatus, PaymentStatus, Prisma, ProductionStatus, CustomerPaymentMethod, SaleStatus } from '@prisma/client';
import { FindAllOrdersDto, OrderPeriod } from './dto/find-all-orders.dto';
import { sub, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns';
import { Decimal } from '@prisma/client/runtime/library';
import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';

// Degressive pricing table: [quantity, discount percentage]
const degressivePricing = [
  { threshold: 1000, discount: new Decimal(0.20) },
  { threshold: 500, discount: new Decimal(0.15) },
  { threshold: 250, discount: new Decimal(0.10) },
  { threshold: 100, discount: new Decimal(0.05) },
];

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) { }

  // Fonction utilitaire pour mapper une commande à son format de réponse
  private mapOrderToResponse(order: any) {
    return {
      ...order,
      id: order.id,
      date: order.orderDate, // Mapper orderDate à date pour le frontend
      subtotal: order.subtotal ? order.subtotal.toNumber() : 0,
      taxAmount: order.taxAmount ? order.taxAmount.toNumber() : 0,
      totalAmount: order.totalAmount ? order.totalAmount.toNumber() : 0,
      amountPaid: order.amountPaid ? order.amountPaid.toNumber() : 0,
      taxRateValue: order.taxRateValue ? order.taxRateValue.toNumber() : 0,
      status: order.status,
      orderItems: order.orderItems?.map((item: any) => ({
        ...item,
        unitPrice: item.unitPrice ? item.unitPrice.toNumber() : 0,
      })) || [],
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
    companyName: string
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
          id: generateId(ID_PREFIXES.CREDITACCOUNT),
          balance: amount,
          lastPaymentDate: new Date(),
          contact: { connect: { id: contactId } },
          subsidiary: { connect: { id: subsidiaryId } },
          clientName: clientName,
          companyName: companyName
        },
      });
    }
  }

  /**
   * 
   * @param createOrderDto // DTO contenant les données de la commande à créer
   * @param user // Utilisateur connecté
   * @param designFiles // Fichiers uploadés
   * @returns // Commande créée
   */
  async create(createOrderDto: CreateOrderDto, user: any, designFiles?: Express.Multer.File[]) {
    const { items, customerName, paymentDueDate, source, opportunityId, paymentMethod } = createOrderDto;

    const paymentDue = new Date(paymentDueDate);
    if (isNaN(paymentDue.getTime())) {
      throw new BadRequestException('Date de paiement invalide');
    }

    // Le corps d'un formulaire multipart est toujours en string, il faut parser les items.
    const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;

    const { id: customerId, contactName, company } = user; // L'utilisateur connecté est le client

    if (!items || items.length === 0) {
      throw new BadRequestException('Une commande doit contenir au moins un article.');
    }

    // 1. Récupérer toutes les données de référence (Produits, Taxe par défaut)
    const productIds = parsedItems.map((item) => item.productId).filter(id => id !== undefined);
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
    const validItems = parsedItems.filter(item => item.productId !== undefined);
    
    // Validation améliorée: vérifier que tous les produits existent
    for (const item of validItems) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new NotFoundException(`Produit avec l'ID ${item.productId} introuvable`);
      }
      const subsidiaryId = product.subsidiaryId;
      if (!itemsBySubsidiary.has(subsidiaryId)) {
        itemsBySubsidiary.set(subsidiaryId, []);
      }
      itemsBySubsidiary.get(subsidiaryId)!.push({ ...item, product });
    }

    // Pré-charger tous les items d'options configurables nécessaires pour le calcul du prix
    const allOptionValues = validItems.flatMap(item => {
      if (!item.options) return [];
      // Transformer l'objet ProductOptions en tableau d'optionValues
      return item.options.map(option => option.optionValue).filter(value => value !== undefined);
    });
    const configurableOptionItems = await this.prisma.configurableOptionItem.findMany({
      where: { optionName: { in: allOptionValues } },
    });
    const optionItemMap = new Map(configurableOptionItems.map(item => [item.optionName, item]));

    // 3. Exécuter la création dans une transaction globale
    return this.prisma.$transaction(async (tx) => {
      const createdOrders: Order[] = [];
      let orderGroup: OrderGroup | null = null;

      // Si plusieurs filiales sont concernées, créer un OrderGroup avec un placeholder
      // Le totalAmount sera mis à jour après le calcul des vrais montants
      if (itemsBySubsidiary.size > 1) {
        orderGroup = await tx.orderGroup.create({
          data: {
            id: generateId(ID_PREFIXES.ORDERGROUP),
            groupCode: `GRP-${Date.now()}`, // Générer un code de groupe unique
            customerId: customerId, // Utiliser l'ID de l'utilisateur connecté
            totalAmount: new Decimal(0), // Placeholder, sera mis à jour après la création des commandes
          },
        });
      }

      // Créer une commande (ou sous-commande) pour chaque filiale
      for (const [subsidiaryId, subsidiaryItems] of itemsBySubsidiary.entries()) {
        // Calculer les totaux pour cette sous-commande
        let subtotal = new Decimal(0);
        const orderItemsData = subsidiaryItems.map((item) => {
          let unitPrice = new Decimal(item.product.sellingPrice);
          if (item.options) {
            for (const opt of item.options) {
              const optionItem = optionItemMap.get(opt.optionValue);
              if (optionItem) {
                unitPrice = unitPrice.mul(optionItem.multiplier);
              }
            }
          }

          // Appliquer la tarification dégressive
          let discount = new Decimal(0);
          for (const tier of degressivePricing) {
            if (item.quantity >= tier.threshold) {
              discount = tier.discount;
              break; // La table est triée, on prend la première correspondance
            }
          }
          const finalUnitPrice = unitPrice.mul(new Decimal(1).sub(discount));
          subtotal = subtotal.add(finalUnitPrice.mul(item.quantity));
          return {
            ...item,
            unitPrice: finalUnitPrice, // Utiliser le prix unitaire final
          };
        });

        const taxAmount = subtotal.mul(taxRate.rate);
        const totalAmount = subtotal.add(taxAmount);

        // Déterminer le statut de paiement initial
        const unpaidMethods: CustomerPaymentMethod[] = [CustomerPaymentMethod.PAY_ON_DELIVERY, CustomerPaymentMethod.CUSTOMER_CREDIT];
        const isPaidImmediately = !unpaidMethods.includes(paymentMethod);
        const initialPaymentStatus = isPaidImmediately ? PaymentStatus.PAID : PaymentStatus.UNPAID;
        const initialAmountPaid = isPaidImmediately ? totalAmount : 0;
        // Créer la commande
        const createdOrder = await tx.order.create({
          data: {
            id: generateId(ID_PREFIXES.ORDER),
            customerName,
            paymentDueDate: paymentDue,
            source,
            subtotal,
            taxAmount,
            totalAmount,
            taxRateValue: taxRate.rate,
            status: OrderStatus.NEW,
            paymentMethod: paymentMethod,
            productionStatus: ProductionStatus.PREPRESS,
            paymentStatus: initialPaymentStatus,
            amountPaid: initialAmountPaid,
            customerId: customerId,
            subsidiaryId,
            taxRateId: taxRate.id,
            opportunityId,
            groupId: orderGroup?.id,
            // Création imbriquée des articles et de l'historique
            orderItems: {
              create: orderItemsData.map((item, index) => {
                // Associer le fichier au bon article.
                // On suppose que l'ordre des fichiers correspond à l'ordre des articles.
                const file = designFiles?.[index];
                return {
                  id: generateId(ID_PREFIXES.ORDERITEM),
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  designFileName: file?.originalname ? file.originalname : item.designFileName,
                  designFileUrl: file ? `/public/order_item_img/${file.filename}` : item.designFileUrl,
                  productId: item.productId,
                  productOptions: item.options
                    ? {
                      create: Object.entries(item.options).map(([optionType, optionValue]) => ({
                        id: generateId(ID_PREFIXES.PRODUCTOPTION),
                        optionType,
                        optionValue: String(optionValue),
                      })),
                    }
                    : undefined,
                };
              }),
            },
            productionHistory: {
              create: {
                id: generateId(ID_PREFIXES.ORDERPRODUCTIONHISTORY),
                status: ProductionStatus.PREPRESS,
              },
            },
          },
        });

        // Récupérer la commande avec ses articles pour le typage correct
        const newOrder = await tx.order.findUnique({
          where: { id: createdOrder.id },
          include: {
            orderItems: true,
          },
        });

        if (!newOrder) {
          throw new InternalServerErrorException('Erreur lors de la récupération de la commande créée');
        }

        // Si la commande est payée immédiatement, décrémenter le stock et créer la vente
        if (isPaidImmediately) {
          for (const item of newOrder.orderItems) {
            if (item.productId) {
              // Utiliser updateMany avec condition de stock pour garantir l'atomicité
              // et empêcher le stock de devenir négatif
              const updated = await tx.product.updateMany({
                where: { id: item.productId, stock: { gte: item.quantity } },
                data: { stock: { decrement: item.quantity } },
              });
              if (updated.count === 0) {
                throw new BadRequestException(`Stock insuffisant pour le produit ${productMap.get(item.productId)!.productName}. Quantité demandée : ${item.quantity}`);
              }
            }
          }

          const salesToCreate = newOrder.orderItems.map(item => ({
            id: generateId(ID_PREFIXES.SALE),
            productName: productMap.get(item.productId!)!.productName,
            quantity: item.quantity,
            totalPrice: new Decimal(item.unitPrice).mul(item.quantity),
            saleDate: new Date(),
            customerName: newOrder.customerName,
            taxRate: newOrder.taxRateValue,
            paymentMethod: newOrder.paymentMethod || paymentMethod,
            customerId: newOrder.customerId,
            subsidiaryId: newOrder.subsidiaryId,
            salesRepId: newOrder.salesRepId,
            orderId: newOrder.id,
            status: SaleStatus.PAID,
          }));

          await tx.sale.createMany({
            data: salesToCreate,
          });
        }

        createdOrders.push(newOrder);
      }

      // Calculer le montant total global réel à partir des commandes créées
      const overallTotalWithTax = createdOrders.reduce((sum, order) => sum.add(order.totalAmount), new Decimal(0));

      // Mettre à jour le montant du groupe si créé
      if (orderGroup) {
        await tx.orderGroup.update({
          where: { id: orderGroup.id },
          data: { totalAmount: overallTotalWithTax },
        });
      }

      // Si le paiement est à crédit, on met à jour le compte crédit du client avec le montant total réel
      if (paymentMethod === CustomerPaymentMethod.CUSTOMER_CREDIT) {
        await this.updateCustomerCredit(tx, customerId, user.subsidiaryId, overallTotalWithTax, contactName, company);
      }

      // Retourner le groupe de commande avec ses sous-commandes, ou la commande unique
      if (orderGroup) {
        return tx.orderGroup.findUniqueOrThrow({
          where: { id: orderGroup.id },
          include: { orders: { include: { orderItems: true } } },
        });
      } else {
        // Vérifier que des commandes ont été créées
        if (createdOrders.length === 0) {
          throw new InternalServerErrorException('Aucune commande n\'a pu être créée. Vérifiez que les produits existent et sont valides.');
        }
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
    const { items, customerId, customerName, paymentDueDate, source, opportunityId, paymentMethod, customTaxRate } = createOrderDto;

    // Le corps d'un formulaire multipart est toujours en string, il faut parser les items.
    const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;

    const { userId: salesRepId, subsidiaryId: salesRepSubsidiaryId } = user;

    if (!parsedItems || parsedItems.length === 0) {
      throw new BadRequestException('Une commande doit contenir au moins un article.');
    }

    // 1. Récupérer toutes les données de référence (Produits, Taxe par défaut, Client)
    const productIds = parsedItems.map((item) => item.productId).filter(id => id !== undefined);
    
    // Validation explicite: vérifier que tous les articles ont un productId
    const itemsWithoutProductId = parsedItems.filter(item => !item.productId);
    if (itemsWithoutProductId.length > 0) {
      throw new BadRequestException('Tous les articles doivent avoir un productId. Articles invalides: ' + JSON.stringify(itemsWithoutProductId, null, 2));
    }
    
    const [products, defaultTaxRate, customer] = await Promise.all([
      this.prisma.product.findMany({ where: { id: { in: productIds } } }),
      this.prisma.taxRate.findFirstOrThrow({ where: { isDefault: true } }),
      this.prisma.contact.findUniqueOrThrow({ where: { id: customerId } }),
    ]);

    // Déterminer le taux de taxe à utiliser (personnalisé ou par défaut)
    let taxRate = defaultTaxRate;
    if (customTaxRate !== undefined) {
      // Créer un objet taxRate temporaire avec le taux personnalisé
      taxRate = {
        ...defaultTaxRate,
        rate: new Decimal(customTaxRate / 100), // Convertir le pourcentage en décimal
      };
    }

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
    const validItems = parsedItems.filter(item => item.productId !== undefined);
    
    // Validation améliorée: vérifier que tous les produits existent
    for (const item of validItems) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new NotFoundException(`Produit avec l'ID ${item.productId} introuvable`);
      }
      const productSubsidiaryId = product.subsidiaryId;
      if (!itemsBySubsidiary.has(productSubsidiaryId)) {
        itemsBySubsidiary.set(productSubsidiaryId, []);
      }
      itemsBySubsidiary.get(productSubsidiaryId)!.push({ ...item, product });
    }

    // Pré-charger tous les items d'options configurables nécessaires pour le calcul du prix
    const allOptionValues = validItems.flatMap(item => {
      if (!item.options) return [];
      // Transformer l'objet ProductOptions en tableau d'optionValues
      return item.options.map(option => option.optionValue).filter(value => value !== undefined);
    });
    const configurableOptionItems = await this.prisma.configurableOptionItem.findMany({
      where: { optionName: { in: allOptionValues } },
    });
    const optionItemMap = new Map(configurableOptionItems.map(item => [item.optionName, item]));

    // 3. Exécuter la création dans une transaction globale
    return this.prisma.$transaction(async (tx) => {
      const createdOrders: Order[] = [];
      let orderGroup: OrderGroup | null = null;
      let overallTotalAmount = new Decimal(0);

      // Calculer le montant total global pour le groupe de commandes
      for (const item of validItems) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new NotFoundException(`Produit avec l'ID ${item.productId} introuvable`);
        }

        const finalUnitPrice = new Decimal(item.unitPrice);
        overallTotalAmount = overallTotalAmount.add(finalUnitPrice.mul(item.quantity));
      }
      const overallTotalWithTax = overallTotalAmount.mul(new Decimal(1).add(taxRate.rate));

      // Si plusieurs filiales sont concernées, créer un OrderGroup
      if (itemsBySubsidiary.size > 1) {
        orderGroup = await tx.orderGroup.create({
          data: {
            id: generateId(ID_PREFIXES.ORDERGROUP),
            groupCode: `GRP-${Date.now()}`,
            customerId: customerId,
            totalAmount: overallTotalWithTax,
          },
        });
      }

      // Créer une commande (ou sous-commande) pour chaque filiale
      for (const [subsidiaryId, subsidiaryItems] of itemsBySubsidiary.entries()) {
        let subtotal = new Decimal(0);
        const orderItemsData = subsidiaryItems.map((item) => {
          const finalUnitPrice = new Decimal(item.unitPrice);
          subtotal = subtotal.add(finalUnitPrice.mul(item.quantity));
          return {
            ...item,
            unitPrice: finalUnitPrice,
          };
        });

        const taxAmount = subtotal.mul(taxRate.rate);
        const totalAmount = subtotal.add(taxAmount);

        // Pour les commandes manuelles, le paiement n'est pas géré à la création.
        const initialPaymentStatus = PaymentStatus.UNPAID;
        const initialAmountPaid = 0;

        const newOrder = await tx.order.create({
          data: {
            id: generateId(ID_PREFIXES.ORDER),
            customerName,
            paymentDueDate: new Date(paymentDueDate),
            source,
            subtotal,
            taxAmount,
            totalAmount,
            taxRateValue: taxRate.rate,
            status: OrderStatus.NEW,
            paymentMethod: paymentMethod, // Persister le mode de paiement prévu, sera potentiellement écrasé lors de l'encaissement
            productionStatus: ProductionStatus.PREPRESS,
            paymentStatus: initialPaymentStatus,
            amountPaid: initialAmountPaid,
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
                  id: generateId(ID_PREFIXES.ORDERITEM),
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  designFileName: file?.originalname,
                  designFileUrl: file ? `/public/order_item_img/${file.filename}` : undefined,
                  productId: item.productId,
                  productOptions: item.options
                    ? { create: Object.entries(item.options).map(([optionType, optionValue]) => ({ id: generateId(ID_PREFIXES.PRODUCTOPTION), optionType, optionValue: String(optionValue) })) }
                    : undefined,
                };
              }),
            },
            productionHistory: {
              create: { id: generateId(ID_PREFIXES.ORDERPRODUCTIONHISTORY), status: ProductionStatus.PREPRESS },
            },
          },
          include: {
            orderItems: true, // Inclure les articles de commande dans la réponse
          },
        });

        createdOrders.push(newOrder);
      }

      // La logique de crédit client est retirée car elle dépend du mode de paiement.
      if (orderGroup) {
        const group = await tx.orderGroup.findUniqueOrThrow({
          where: { id: orderGroup.id },
          include: { orders: { include: { orderItems: true } } },
        });
        return {
          ...group,
          totalAmount: group.totalAmount.toNumber(),
          orders: group.orders.map(this.mapOrderToResponse),
        };
      } else {
        // Vérifier que des commandes ont été créées
        if (createdOrders.length === 0) {
          throw new InternalServerErrorException('Aucune commande n\'a pu être créée. Vérifiez que les produits existent et sont valides.');
        }
        const order = await tx.order.findUniqueOrThrow({
          where: { id: createdOrders[0].id },
          include: { orderItems: true },
        });
        return this.mapOrderToResponse(order);
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

    // Appliquer les filtres uniquement s'ils ont une valeur non-vide
    if (customerId && customerId.trim()) {
      where.customerId = customerId;
    }

    if (productId && productId.trim()) {
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
        const parsedStartDate = new Date(startDate);
        const parsedEndDate = new Date(endDate);

        if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
          throw new BadRequestException('Les dates fournies ne sont pas au bon format.');
        }

        dateFilter = { gte: parsedStartDate, lte: parsedEndDate };
      }
      where.orderDate = dateFilter;
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        customer: true,
        salesRep: true,
        orderItems: { include: { product: true } },
      },
      orderBy: { orderDate: 'desc' },
    });

    // Mapper les commandes pour renvoyer les champs attendus par le frontend
    return orders.map(order => ({
      ...order,
      date: order.orderDate, // Mapper orderDate à date pour le frontend
      totalAmount: order.totalAmount ? order.totalAmount.toNumber() : 0,
      subtotal: order.subtotal ? order.subtotal.toNumber() : 0,
      taxAmount: order.taxAmount ? order.taxAmount.toNumber() : 0,
      amountPaid: order.amountPaid ? order.amountPaid.toNumber() : 0,
      taxRateValue: order.taxRateValue ? order.taxRateValue.toNumber() : 0,
      orderItems: order.orderItems.map(item => ({
        ...item,
        unitPrice: item.unitPrice ? item.unitPrice.toNumber() : 0,
      })),
    }));
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

    // Mapper les champs pour le frontend
    return {
      ...order,
      date: order.orderDate,
      totalAmount: order.totalAmount ? order.totalAmount.toNumber() : 0,
      subtotal: order.subtotal ? order.subtotal.toNumber() : 0,
      taxAmount: order.taxAmount ? order.taxAmount.toNumber() : 0,
      amountPaid: order.amountPaid ? order.amountPaid.toNumber() : 0,
      taxRateValue: order.taxRateValue ? order.taxRateValue.toNumber() : 0,
      orderItems: order.orderItems.map(item => ({
        ...item,
        unitPrice: item.unitPrice ? item.unitPrice.toNumber() : 0,
      })),
    };
  }

  /**
   *
   * @param id // ID de la commande
   * @param updateDto // DTO contenant le statut de la commande à mettre à jour
   * @param user // Utilisateur connecté
   * @returns // Commande mise à jour
   */
  async updateOrderStatus(id: string, updateDto: UpdateOrderStatusDto, user: any) {
    // Vérifier que la commande existe et appartient à la bonne filiale
    const order = await this.prisma.order.findUnique({
      where: { id, subsidiaryId: user.subsidiaryId },
    });

    if (!order) {
      throw new NotFoundException(`Commande avec l'ID "${id}" non trouvée.`);
    }

    // Empêcher toute modification d'une commande annulée
    if (order.status === 'CANCELLED') {
      throw new ConflictException('Une commande annulée ne peut pas être modifiée.');
    }

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
  async updateProductionStatus(id: string, updateDto: updateProductionStatusDto, user: any){
    const order = await this.prisma.order.findUnique({
      where: { id, subsidiaryId: user.subsidiaryId },
    });

    if (!order) {
      throw new NotFoundException(`Commande avec l'ID "${id}" non trouvée.`);
    }

    // Empêcher toute modification de production pour une commande annulée
    if (order.status === 'CANCELLED') {
      throw new ConflictException('Le statut de production d\'une commande annulée ne peut pas être modifié.');
    }

    return this.prisma.$transaction(async (tx) => {
      const updateProduction = await tx.order.update({
        where: { id },
        data: { productionStatus: updateDto.productionStatus},
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
      WHERE o.subsidiary_id = ${subsidiaryId}
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

      // Empêcher le paiement d'une commande annulée
      if (order.status === 'CANCELLED') {
        throw new ConflictException('Le paiement d\'une commande annulée n\'est pas autorisé.');
      }

      // 2. Valider le paiement
      const newAmountPaid = order.amountPaid.add(paymentAmount);
      if (newAmountPaid.greaterThan(order.totalAmount)) {
        throw new BadRequestException('Le montant payé ne peut pas dépasser le total de la commande.');
      }

      const remainingBalance = order.totalAmount.sub(newAmountPaid);
      const newPaymentStatus = remainingBalance.isZero() ? PaymentStatus.PAID : PaymentStatus.PARTIALLY_PAID;

      // Utiliser updateMany avec verrou optimiste pour éviter les race conditions
      const updateCount = await tx.order.updateMany({
        where: {
          id,
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
        throw new ConflictException('Cette commande a été modifiée entre-temps. Veuillez réessayer.');
      }

      // Re-récupérer la commande mise à jour
      const updatedOrder = await tx.order.findUniqueOrThrow({
        where: { id },
        include: { orderItems: { include: { product: true } }, customer: true },
      });

      // 4. Si la commande est entièrement payée, mettre à jour le stock et créer les ventes
      if (newPaymentStatus === PaymentStatus.PAID) {
        // D'abord, mettre à jour le stock de manière atomique
        for (const item of updatedOrder.orderItems) {
          if (item.productId) {
            // Utiliser updateMany avec condition de stock pour garantir l'atomicité
            const updateResult = await tx.product.updateMany({
              where: {
                id: item.productId,
                stock: { gte: item.quantity }, // Vérifier que le stock est suffisant
              },
              data: {
                stock: {
                  decrement: item.quantity,
                },
              },
            });

            if (updateResult.count === 0) {
              throw new BadRequestException(`Stock insuffisant pour le produit ${item.product?.productName || item.productId}. Quantité demandée : ${item.quantity}`);
            }
          }
        }

        // Ensuite, créer les enregistrements de vente
        const salesToCreate = updatedOrder.orderItems.map(item => {
          if (!item.product) {
            // Ce cas ne devrait pas arriver si la base est cohérente, mais c'est une sécurité.
            throw new InternalServerErrorException(`Produit manquant pour l'article de commande ${item.id}`);
          }
          return {
            id: generateId(ID_PREFIXES.SALE),
            productName: item.product.productName,
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
  async getAllCustomerCredit(user:any){
    const creditAccount = await this.prisma.creditAccount.findMany({
      where: {subsidiaryId: user.subsidiaryId},
    })
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
      throw new NotFoundException(`Compte de crédit avec l'ID "${id}" non trouvé.`);
    }

    return creditAccount;
  }
}
