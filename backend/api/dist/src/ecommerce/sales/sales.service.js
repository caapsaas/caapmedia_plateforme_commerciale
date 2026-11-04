"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const find_all_sales_dto_1 = require("./dto/find-all-sales.dto");
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
const product_specs_service_1 = require("../products/product-specs/product-specs.service");
const order_notifications_service_1 = require("../../notifications/order-notifications.service");
const generate_id_util_1 = require("../../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../../common/constants/id-prefixes.const");
const pagination_1 = require("../../common/pagination/pagination");
const date_fns_1 = require("date-fns");
let SalesService = class SalesService {
    prisma;
    productSpecsService;
    orderNotifications;
    constructor(prisma, productSpecsService, orderNotifications) {
        this.prisma = prisma;
        this.productSpecsService = productSpecsService;
        this.orderNotifications = orderNotifications;
    }
    async createDirectSale(createDirectSaleDto, user) {
        const { items, paymentMethod, customerId, applyTax = true, bankAccountId, transactionReference, } = createDirectSaleDto;
        const BANKING_METHODS = [
            client_1.CustomerPaymentMethod.BANK_TRANSFER,
            client_1.CustomerPaymentMethod.CARD,
            client_1.CustomerPaymentMethod.CHECK,
        ];
        const isBankingPayment = BANKING_METHODS.includes(paymentMethod);
        if (isBankingPayment && !bankAccountId) {
            throw new common_1.BadRequestException('Un compte bancaire doit être sélectionné pour ce mode de paiement.');
        }
        const { id: salesRepId, subsidiaryId } = user;
        if (!items || items.length === 0) {
            throw new common_1.BadRequestException('Une vente doit contenir au moins un article.');
        }
        return this.prisma
            .$transaction(async (tx) => {
            const productIds = items.map((item) => item.productId);
            const [products, taxRate, customer] = await Promise.all([
                tx.item.findMany({
                    where: { id: { in: productIds }, type: client_1.ItemType.SERVICE },
                }),
                tx.taxRate.findFirstOrThrow({ where: { isDefault: true } }),
                tx.contact.findUnique({ where: { id: customerId } }),
            ]);
            if (!customer) {
                throw new common_1.NotFoundException(`Client avec l'ID ${customerId} non trouvé.`);
            }
            if (products.length !== productIds.length) {
                throw new common_1.NotFoundException('Un ou plusieurs produits sont introuvables.');
            }
            const productMap = new Map(products.map((p) => [p.id, p]));
            const distinctProductIds = [...new Set(productIds)];
            const formDefinitionByProductId = new Map(await Promise.all(distinctProductIds.map(async (productId) => {
                const definition = await this.productSpecsService.getFormDefinition(productId);
                return [productId, definition];
            })));
            for (const item of items) {
                const definition = formDefinitionByProductId.get(item.productId);
                if (definition) {
                    this.productSpecsService.validateAgainstDefinition(definition, item.specValues);
                }
            }
            let subtotal = new library_1.Decimal(0);
            const orderItemsData = items.map((item) => {
                const product = productMap.get(item.productId);
                if (!product) {
                    throw new common_1.NotFoundException(`Produit avec ID ${item.productId} non trouvé.`);
                }
                const unitPrice = new library_1.Decimal(item.unitPrice);
                const discount = new library_1.Decimal(item.discount ?? 0);
                const assemblyPrice = item.assemblyPrice != null ? new library_1.Decimal(item.assemblyPrice) : null;
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
                    specValues: item.specValues,
                    specSnapshot: formDefinitionByProductId.get(item.productId),
                };
            });
            const effectiveTaxRate = applyTax ? taxRate.rate : new library_1.Decimal(0);
            const taxAmount = subtotal.mul(effectiveTaxRate);
            const totalAmount = subtotal.add(taxAmount);
            const newOrder = await tx.order.create({
                data: {
                    id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ORDER),
                    customerName: customer.contactName,
                    paymentDueDate: new Date(),
                    source: client_1.OrderSource.MANUAL,
                    subtotal,
                    taxAmount,
                    totalAmount,
                    taxRateValue: effectiveTaxRate,
                    applyTax,
                    status: client_1.OrderStatus.PENDING_VALIDATION,
                    paymentMethod: paymentMethod,
                    productionStatus: client_1.ProductionStatus.PREPRESS,
                    paymentStatus: client_1.PaymentStatus.PAID,
                    amountPaid: totalAmount,
                    customerId,
                    subsidiaryId,
                    taxRateId: taxRate.id,
                    salesRepId,
                    productionHistory: {
                        create: {
                            id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ORDERPRODUCTIONHISTORY),
                            status: client_1.ProductionStatus.PREPRESS,
                        },
                    },
                    orderItems: {
                        create: orderItemsData.map((item) => ({
                            id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ORDERITEM),
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
            const salesToCreate = orderItemsData.map((item) => {
                const itemTax = item.total.mul(effectiveTaxRate);
                const itemTotalPrice = item.total.add(itemTax);
                return {
                    id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.SALE),
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
                    status: client_1.SaleStatus.PAID,
                    specValues: item.specValues,
                    specSnapshot: item.specSnapshot,
                };
            });
            const result = await tx.sale.createMany({
                data: salesToCreate,
            });
            if (isBankingPayment && bankAccountId) {
                const bankAccount = await tx.treasuryAccount.findFirst({
                    where: { id: bankAccountId, subsidiaryId },
                });
                if (!bankAccount) {
                    throw new common_1.NotFoundException(`Compte bancaire ${bankAccountId} introuvable pour cette filiale.`);
                }
                await tx.financialTransaction.create({
                    data: {
                        transactionDate: new Date(),
                        description: `Encaissement ${paymentMethod} — Commande ${newOrder.id} — ${customer.contactName}`,
                        amount: totalAmount,
                        relatedDocumentId: newOrder.id,
                        subsidiaryId,
                        financialTransactionType: client_1.TransactionType.RECETTE,
                        treasuryAccountId: bankAccountId,
                        status: client_1.TransactionStatus.EN_ATTENTE,
                        reference: transactionReference || null,
                    },
                });
            }
            return {
                message: `${result.count} vente(s) enregistrée(s) avec succès (Commande ${newOrder.id}).`,
                orderId: newOrder.id,
            };
        })
            .then(async (result) => {
            const order = { id: result.orderId, subsidiaryId: user.subsidiaryId };
            await this.orderNotifications.created(order);
            await this.orderNotifications.paymentReceived(order);
            return result;
        });
    }
    async findAll(user, query) {
        const { customerId, salesRepId, paymentMethod, period, startDate, endDate, } = query;
        const { subsidiaryId, userRole, userId } = user;
        const where = {
            subsidiaryId: subsidiaryId,
        };
        if (userRole === client_1.UserRole.COMMERCIAL) {
            where.salesRepId = userId;
        }
        else if (salesRepId) {
            where.salesRepId = salesRepId;
        }
        if (customerId) {
            where.customerId = customerId;
        }
        if (paymentMethod) {
            where.paymentMethod = paymentMethod;
        }
        if (period && period !== find_all_sales_dto_1.OrderPeriod.ALL_TIME) {
            const now = new Date();
            let dateFilter = {};
            if (period === find_all_sales_dto_1.OrderPeriod.THIS_MONTH) {
                dateFilter = { gte: (0, date_fns_1.startOfMonth)(now), lte: (0, date_fns_1.endOfMonth)(now) };
            }
            else if (period === find_all_sales_dto_1.OrderPeriod.LAST_MONTH) {
                const lastMonth = (0, date_fns_1.subMonths)(now, 1);
                dateFilter = {
                    gte: (0, date_fns_1.startOfMonth)(lastMonth),
                    lte: (0, date_fns_1.endOfMonth)(lastMonth),
                };
            }
            else if (period === find_all_sales_dto_1.OrderPeriod.LAST_7_DAYS) {
                dateFilter = { gte: (0, date_fns_1.sub)(now, { days: 7 }) };
            }
            else if (period === find_all_sales_dto_1.OrderPeriod.LAST_30_DAYS) {
                dateFilter = { gte: (0, date_fns_1.sub)(now, { days: 30 }) };
            }
            else if (period === find_all_sales_dto_1.OrderPeriod.THIS_YEAR) {
                dateFilter = { gte: (0, date_fns_1.startOfYear)(now), lte: (0, date_fns_1.endOfYear)(now) };
            }
            else if (period === find_all_sales_dto_1.OrderPeriod.CUSTOM) {
                if (!startDate || !endDate) {
                    throw new common_1.BadRequestException('Pour une période personnalisée, les dates de début et de fin sont requises.');
                }
                dateFilter = { gte: new Date(startDate), lte: new Date(endDate) };
            }
            where.saleDate = dateFilter;
        }
        if (query.search) {
            where.productName = { contains: query.search, mode: 'insensitive' };
        }
        return (0, pagination_1.paginate)(this.prisma.sale, {
            where,
            include: { customer: true, salesRep: true },
            orderBy: { saleDate: 'desc' },
        }, query);
    }
};
exports.SalesService = SalesService;
exports.SalesService = SalesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        product_specs_service_1.ProductSpecsService,
        order_notifications_service_1.OrderNotificationsService])
], SalesService);
//# sourceMappingURL=sales.service.js.map