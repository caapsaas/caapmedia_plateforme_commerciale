import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { CreateDirectSaleDto } from './dto/create-sale.dto';
import { FindAllSalesDto, OrderPeriod } from './dto/find-all-sales.dto';
import { CustomerPaymentMethod, ItemType, OrderSource, OrderStatus, PaymentStatus, ProductionStatus, Prisma, SaleStatus, TransactionStatus, TransactionType, UserRole } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { ProductSpecsService } from '../products/product-specs/product-specs.service';
import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';
import { paginate } from 'src/common/pagination/pagination';
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
   * Respecte le principe de vente de la plateforme : crée une véritable Commande (Order + OrderItems)
   * immédiatement payée (PAID) et génère les enregistrements de vente (Sale) associés.
   * @param createDirectSaleDto Les données de la vente
   * @param user L'utilisateur connecté (caissier / commercial)
   */
  async createDirectSale(createDirectSaleDto: CreateDirectSaleDto, user: any) {
    const { items, paymentMethod, customerId, applyTax = true, bankAccountId, transactionReference } = createDirectSaleDto;

    // Moyens de paiement nécessitant un compte bancaire et une validation par SUPER_ADMIN
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

      // Validation des spécifications techniques (Chantier 5)
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

      // 2. Calculer les montants selon les règles métiers (Sous-total, Remise, Assemblage, TVA)
      let subtotal = new Decimal(0);
      const orderItemsData = items.map((item) => {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new NotFoundException(
            `Produit avec ID ${item.productId} non trouvé.`,
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
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity,
          unitPrice,
          discount,
          assemblyPrice,
          total,
          specValues: item.specValues as Prisma.InputJsonValue | undefined,
          specSnapshot: formDefinitionByProductId.get(
            item.productId,
          ) as unknown as Prisma.InputJsonValue | undefined,
        };
      });

      const effectiveTaxRate = applyTax ? taxRate.rate : new Decimal(0);
      const taxAmount = subtotal.mul(effectiveTaxRate);
      const totalAmount = subtotal.add(taxAmount);

      // 3. Créer la commande réelle (Order) pour respecter le principe de vente de l'application
      const newOrder = await tx.order.create({
        data: {
          id: generateId(ID_PREFIXES.ORDER),
          customerName: customer.contactName,
          paymentDueDate: new Date(),
          source: OrderSource.MANUAL,
          subtotal,
          taxAmount,
          totalAmount,
          taxRateValue: effectiveTaxRate,
          applyTax,
          status: OrderStatus.IN_PRODUCTION,
          paymentMethod: paymentMethod,
          productionStatus: ProductionStatus.PREPRESS,
          paymentStatus: PaymentStatus.PAID,
          amountPaid: totalAmount,
          customerId,
          subsidiaryId,
          taxRateId: taxRate.id,
          salesRepId,
          orderItems: {
            create: orderItemsData.map((item) => ({
              id: generateId(ID_PREFIXES.ORDERITEM),
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              assemblyPrice: item.assemblyPrice,
              total: item.total,
              specValues: item.specValues,
              specSnapshot: item.specSnapshot,
              productId: item.productId,
            })),
          },
        },
      });

      // 4. Créer les enregistrements de vente (Sale) liés à la commande
      const salesToCreate: Prisma.SaleCreateManyInput[] = orderItemsData.map(
        (item) => {
          const itemTax = item.total.mul(effectiveTaxRate);
          const itemTotalPrice = item.total.add(itemTax);

          return {
            id: generateId(ID_PREFIXES.SALE),
            productName: item.productName,
            quantity: item.quantity,
            totalPrice: itemTotalPrice,
            saleDate: new Date(),
            customerName: customer.contactName,
            taxRate: effectiveTaxRate,
            paymentMethod: paymentMethod,
            customerId: customerId,
            subsidiaryId: subsidiaryId,
            salesRepId: salesRepId,
            orderId: newOrder.id,
            status: SaleStatus.PAID,
            specValues: item.specValues,
            specSnapshot: item.specSnapshot,
          };
        },
      );

      const result = await tx.sale.createMany({
        data: salesToCreate,
      });

      // 5. Pour les paiements bancaires : créer une FinancialTransaction EN_ATTENTE de validation
      if (isBankingPayment && bankAccountId) {
        const bankAccount = await tx.treasuryAccount.findFirst({
          where: { id: bankAccountId, subsidiaryId },
        });
        if (!bankAccount) {
          throw new NotFoundException(
            `Compte bancaire ${bankAccountId} introuvable pour cette filiale.`,
          );
        }

        await tx.financialTransaction.create({
          data: {
            transactionDate: new Date(),
            description: `Encaissement ${paymentMethod} — Commande ${newOrder.id} — ${customer.contactName}`,
            amount: totalAmount,
            relatedDocumentId: newOrder.id,
            subsidiaryId,
            financialTransactionType: TransactionType.RECETTE,
            treasuryAccountId: bankAccountId,
            status: TransactionStatus.EN_ATTENTE,
            reference: transactionReference || null,
          },
        });
      }

      return {
        message: `${result.count} vente(s) enregistrée(s) avec succès (Commande ${newOrder.id}).`,
        orderId: newOrder.id,
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

    if (query.search) {
      where.productName = { contains: query.search, mode: 'insensitive' };
    }

    return paginate(
      this.prisma.sale,
      {
        where,
        include: { customer: true, salesRep: true },
        orderBy: { saleDate: 'desc' },
      },
      query,
    );
  }
}
