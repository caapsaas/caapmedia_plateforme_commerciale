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
exports.OrdersService = void 0;
const role_identity_1 = require("../../common/auth/role/role-identity");
const subsidiary_scope_1 = require("../../common/utils/subsidiary-scope");
const common_1 = require("@nestjs/common");
const generate_id_util_1 = require("../../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../../common/constants/id-prefixes.const");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const client_1 = require("@prisma/client");
const find_all_orders_dto_1 = require("./dto/find-all-orders.dto");
const pagination_1 = require("../../common/pagination/pagination");
const date_fns_1 = require("date-fns");
const library_1 = require("@prisma/client/runtime/library");
const product_specs_service_1 = require("../products/product-specs/product-specs.service");
const order_notifications_service_1 = require("../../notifications/order-notifications.service");
const order_workflow_1 = require("./order-workflow");
const orderCustomerSelect = {
    id: true,
    contactName: true,
    company: true,
    email: true,
    phone: true,
    address: true,
    subsidiaryId: true,
};
const orderSalesRepSelect = {
    id: true,
    userName: true,
    email: true,
    subsidiaryId: true,
};
let OrdersService = class OrdersService {
    prisma;
    productSpecsService;
    orderNotifications;
    constructor(prisma, productSpecsService, orderNotifications) {
        this.prisma = prisma;
        this.productSpecsService = productSpecsService;
        this.orderNotifications = orderNotifications;
    }
    mapOrderToResponse(order) {
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
            paymentMethod: order
                .paymentMethod ?? null,
            productionHistory: order.productionHistory ?? [],
            orderItems: (order.orderItems ?? []).map((item) => ({
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
    async createBySalesRep(createOrderDto, user, designFiles) {
        const { items, customerId, customerName, paymentDueDate, source, opportunityId, applyTax = true, occasionalCustomer, } = createOrderDto;
        if (Boolean(customerId?.trim()) === Boolean(occasionalCustomer)) {
            throw new common_1.BadRequestException('Sélectionnez un client existant ou renseignez un client occasionnel.');
        }
        if (occasionalCustomer && opportunityId) {
            throw new common_1.BadRequestException('Une opportunité existante nécessite un client existant.');
        }
        if (!user.subsidiaryId) {
            throw new common_1.BadRequestException('Une filiale est requise pour créer une commande.');
        }
        const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
        if ((designFiles?.length ?? 0) > (parsedItems?.length ?? 0)) {
            throw new common_1.BadRequestException('Un fichier de conception au maximum par article.');
        }
        const { id: salesRepId, subsidiaryId: salesRepSubsidiaryId } = user;
        if (!parsedItems || parsedItems.length === 0) {
            throw new common_1.BadRequestException('Une commande doit contenir au moins un article.');
        }
        const itemsWithoutProductId = parsedItems.filter((item) => !item.productId);
        if (itemsWithoutProductId.length > 0) {
            throw new common_1.BadRequestException('Tous les articles doivent avoir un productId. Articles invalides: ' +
                JSON.stringify(itemsWithoutProductId, null, 2));
        }
        const productIds = parsedItems.map((item) => item.productId);
        const distinctProductIds = [...new Set(productIds)];
        const [products, taxRate] = await Promise.all([
            this.prisma.item.findMany({
                where: { id: { in: productIds }, type: client_1.ItemType.SERVICE },
            }),
            this.prisma.taxRate.findFirstOrThrow({ where: { isDefault: true } }),
            customerId
                ? this.prisma.contact.findUniqueOrThrow({ where: { id: customerId } })
                : Promise.resolve(null),
        ]);
        if (products.length !== distinctProductIds.length) {
            throw new common_1.NotFoundException('Un ou plusieurs services sont introuvables.');
        }
        const productMap = new Map(products.map((p) => [p.id, p]));
        const formDefinitionByProductId = new Map(await Promise.all(distinctProductIds.map(async (productId) => {
            const definition = await this.productSpecsService.getFormDefinition(productId);
            return [productId, definition];
        })));
        for (const item of parsedItems) {
            const definition = formDefinitionByProductId.get(item.productId);
            if (definition) {
                this.productSpecsService.validateAgainstDefinition(definition, item.specValues);
            }
        }
        let subtotal = new library_1.Decimal(0);
        const orderItemsData = parsedItems.map((item) => {
            if (!productMap.has(item.productId)) {
                throw new common_1.NotFoundException(`Produit avec l'ID ${item.productId} introuvable`);
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
                ...item,
                unitPrice,
                discount,
                assemblyPrice,
                total,
                specSnapshot: formDefinitionByProductId.get(item.productId),
            };
        });
        const effectiveTaxRate = applyTax ? taxRate.rate : new library_1.Decimal(0);
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
                        throw new common_1.ConflictException('Un client utilise déjà cet email. Sélectionnez sa fiche existante.');
                    }
                }
                const contact = await tx.contact.create({
                    data: {
                        id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.CONTACT),
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
                    id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ORDER),
                    customerName: occasionalCustomer?.name ?? customerName,
                    paymentDueDate: new Date(paymentDueDate),
                    source,
                    subtotal,
                    taxAmount,
                    totalAmount,
                    taxRateValue: effectiveTaxRate,
                    applyTax,
                    status: client_1.OrderStatus.PENDING_VALIDATION,
                    paymentMethod: createOrderDto.paymentMethod,
                    productionStatus: client_1.ProductionStatus.PREPRESS,
                    paymentStatus: client_1.PaymentStatus.UNPAID,
                    amountPaid: 0,
                    customerId: effectiveCustomerId,
                    subsidiaryId: salesRepSubsidiaryId,
                    taxRateId: taxRate.id,
                    salesRepId,
                    opportunityId,
                    orderItems: {
                        create: orderItemsData.map((item, index) => {
                            const file = designFiles?.[index];
                            return {
                                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ORDERITEM),
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
                                            id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.PRODUCTOPTION),
                                            optionType: option.optionType,
                                            optionValue: option.optionValue,
                                        })),
                                    }
                                    : undefined,
                            };
                        }),
                    },
                    productionHistory: {
                        create: {
                            id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ORDERPRODUCTIONHISTORY),
                            status: client_1.ProductionStatus.PREPRESS,
                        },
                    },
                },
                include: {
                    orderItems: { include: { product: true } },
                },
            });
            for (let i = 0; i < parsedItems.length; i++) {
                const item = parsedItems[i];
                const orderItemId = newOrder.orderItems[i].id;
                if (item.productionSteps?.length) {
                    await tx.orderItemProductionStep.createMany({
                        data: item.productionSteps.map((step) => ({
                            id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ORDERITEMPRODUCTIONSTEP),
                            orderItemId,
                            equipmentId: step.equipmentId,
                            equipmentNameSnapshot: step.equipmentNameSnapshot,
                            stepOrder: step.stepOrder,
                            estimatedTimeHours: new library_1.Decimal(step.estimatedTimeHours),
                            hourlyRateSnapshot: new library_1.Decimal(step.hourlyRateSnapshot),
                            calculatedCost: new library_1.Decimal(step.calculatedCost),
                        })),
                    });
                }
                if (item.productionSummary) {
                    await tx.orderItemProductionSummary.create({
                        data: {
                            id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ORDERITEMPRODUCTIONSUMMARY),
                            orderItemId,
                            totalProductionCost: new library_1.Decimal(item.productionSummary.totalProductionCost),
                            marginPercent: new library_1.Decimal(item.productionSummary.marginPercent),
                            finalPrice: new library_1.Decimal(item.productionSummary.finalPrice),
                        },
                    });
                }
            }
            return newOrder;
        });
        await this.orderNotifications.created(createdOrder);
        return this.mapOrderToResponse(createdOrder);
    }
    async findAll(user, query) {
        const { customerId, productId, orderStatus, paymentStatus, period, startDate, endDate, subsidiaryId: querySubsidiaryId, salesRepId: querySalesRepId, } = query;
        const isSuperAdmin = user.role === 'SUPER_ADMIN' || user.userRole === 'SUPER_ADMIN';
        const where = isSuperAdmin
            ? querySubsidiaryId
                ? { subsidiaryId: querySubsidiaryId }
                : {}
            : { subsidiaryId: user.subsidiaryId };
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
            where.status = orderStatus;
        }
        if (paymentStatus && paymentStatus.trim()) {
            where.paymentStatus = paymentStatus;
        }
        if (period && period !== find_all_orders_dto_1.OrderPeriod.ALL_TIME) {
            const now = new Date();
            let dateFilter = {};
            if (period === find_all_orders_dto_1.OrderPeriod.THIS_MONTH) {
                dateFilter = { gte: (0, date_fns_1.startOfMonth)(now), lte: (0, date_fns_1.endOfMonth)(now) };
            }
            else if (period === find_all_orders_dto_1.OrderPeriod.LAST_MONTH) {
                const lastMonth = (0, date_fns_1.subMonths)(now, 1);
                dateFilter = {
                    gte: (0, date_fns_1.startOfMonth)(lastMonth),
                    lte: (0, date_fns_1.endOfMonth)(lastMonth),
                };
            }
            else if (period === find_all_orders_dto_1.OrderPeriod.LAST_7_DAYS) {
                dateFilter = { gte: (0, date_fns_1.sub)(now, { days: 7 }) };
            }
            else if (period === find_all_orders_dto_1.OrderPeriod.LAST_30_DAYS) {
                dateFilter = { gte: (0, date_fns_1.sub)(now, { days: 30 }) };
            }
            else if (period === find_all_orders_dto_1.OrderPeriod.LAST_90_DAYS) {
                dateFilter = { gte: (0, date_fns_1.sub)(now, { days: 90 }) };
            }
            else if (period === find_all_orders_dto_1.OrderPeriod.THIS_YEAR) {
                dateFilter = { gte: (0, date_fns_1.startOfYear)(now), lte: (0, date_fns_1.endOfYear)(now) };
            }
            else if (period === find_all_orders_dto_1.OrderPeriod.CUSTOM) {
                if (!startDate || !endDate) {
                    throw new common_1.BadRequestException('Pour une période personnalisée, les dates de début et de fin sont requises.');
                }
                const parsedStartDate = new Date(startDate);
                const parsedEndDate = new Date(endDate);
                if (isNaN(parsedStartDate.getTime()) ||
                    isNaN(parsedEndDate.getTime())) {
                    throw new common_1.BadRequestException('Les dates fournies ne sont pas au bon format.');
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
            take: 2000,
        });
        return orders.map((order) => this.mapOrderToResponse(order));
    }
    async findOneForCustomer(id, contact) {
        const order = await this.prisma.order.findUnique({
            where: { id, customerId: contact.id },
            include: this.orderFullInclude,
        });
        if (!order) {
            throw new common_1.NotFoundException(`Commande avec l'ID "${id}" non trouvée.`);
        }
        return this.mapOrderToResponse(order);
    }
    async findOne(id, user) {
        const order = await this.prisma.order.findUnique({
            where: (0, subsidiary_scope_1.withSubsidiaryScope)({
                id,
                ...((0, role_identity_1.getActiveRole)(user) === client_1.UserRole.COMMERCIAL
                    ? { salesRepId: user.id }
                    : {}),
            }, (0, subsidiary_scope_1.resolveScopeContext)(user)),
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
            throw new common_1.NotFoundException(`Commande avec l'ID "${id}" non trouvée.`);
        }
        return this.mapOrderToResponse(order);
    }
    async updateOrderStatus(id, updateDto, user) {
        if (!user.subsidiaryId)
            throw new common_1.ForbiddenException('Filiale requise.');
        const order = await this.prisma.order.findUnique({
            where: { id, subsidiaryId: user.subsidiaryId },
        });
        if (!order) {
            throw new common_1.NotFoundException(`Commande avec l'ID "${id}" non trouvée.`);
        }
        (0, order_workflow_1.assertOrderTransition)(order, updateDto.status, user);
        if (order.status === updateDto.status)
            return this.mapOrderToResponse(order);
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
                },
                data: { status: updateDto.status },
                include: this.orderFullInclude,
            });
            return this.mapOrderToResponse(updatedOrder);
        })
            .catch((error) => this.handleStatusConflict(error))
            .then(async (updated) => {
            await this.orderNotifications.statusChanged(order, updateDto.status, order.status);
            return updated;
        });
    }
    handleStatusConflict(error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2025') {
            throw new common_1.ConflictException('Le statut de cette commande a changé. Actualisez la liste avant de réessayer.');
        }
        throw error;
    }
    async updateProductionStatus(id, updateDto, user) {
        if (!user.subsidiaryId)
            throw new common_1.ForbiddenException('Filiale requise.');
        const order = await this.prisma.order.findUnique({
            where: { id, subsidiaryId: user.subsidiaryId },
        });
        if (!order)
            throw new common_1.NotFoundException(`Commande "${id}" introuvable.`);
        const nextStatus = (0, order_workflow_1.nextOrderStatusForProduction)(order, updateDto.productionStatus, user);
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
                    id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ORDERPRODUCTIONHISTORY),
                    orderId: id,
                    status: updateDto.productionStatus,
                },
            });
            return updateProduction;
        })
            .catch((error) => this.handleStatusConflict(error));
        if (order.productionStatus !== updateDto.productionStatus) {
            await this.orderNotifications.productionChanged(updated, updateDto.productionStatus);
        }
        return updated;
    }
    async findGroupsByCustomer(customerId, contact) {
        if (customerId !== contact.id) {
            throw new common_1.ForbiddenException('Accès aux commandes de ce client interdit.');
        }
        const [groups, singleOrders] = await Promise.all([
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
            this.prisma.order.findMany({
                where: { customerId, groupId: null },
                include: {
                    orderItems: {
                        include: { product: true, productOptions: true },
                    },
                },
            }),
        ]);
        const groupedOrders = groups.map((group) => ({
            groupId: group.id,
            groupCode: group.groupCode,
            totalAmount: group.totalAmount.toNumber(),
            createdAt: group.createdAt,
            orders: group.orders.map(this.mapOrderToResponse),
        }));
        const singleOrderGroups = singleOrders.map((order) => ({
            groupId: order.id,
            groupCode: `ORD-${order.id.substring(0, 8)}`,
            totalAmount: order.totalAmount.toNumber(),
            createdAt: order.orderDate,
            orders: [this.mapOrderToResponse(order)],
        }));
        const allOrders = [...groupedOrders, ...singleOrderGroups];
        allOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return allOrders;
    }
    async getBestSellingProducts(user, query, limit = 10) {
        const isSuperAdmin = user.role === 'SUPER_ADMIN' || user.userRole === 'SUPER_ADMIN';
        const effectiveSubsidiaryId = isSuperAdmin
            ? (query?.subsidiaryId ?? null)
            : user.subsidiaryId;
        const conditions = [];
        if (effectiveSubsidiaryId) {
            conditions.push(client_1.Prisma.sql `AND o.subsidiary_id = ${effectiveSubsidiaryId}`);
        }
        if (query?.salesRepId) {
            conditions.push(client_1.Prisma.sql `AND o.sales_rep_id = ${query.salesRepId}`);
        }
        const extraConditions = conditions.length > 0
            ? client_1.Prisma.join(conditions, '\n      ')
            : client_1.Prisma.empty;
        const result = await this.prisma.$queryRaw(client_1.Prisma.sql `
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
    async findPaymentAccounts(user) {
        if (!user.subsidiaryId) {
            throw new common_1.ForbiddenException('Filiale requise pour enregistrer un paiement.');
        }
        return this.prisma.treasuryAccount.findMany({
            where: { subsidiaryId: user.subsidiaryId, accountType: 'BANQUE' },
            select: { id: true, accountName: true },
            orderBy: { accountName: 'asc' },
        });
    }
    async recordPayment(id, recordPaymentDto, user) {
        const { amount, paymentMethod, bankAccountId, transactionReference } = recordPaymentDto;
        const BANKING_METHODS = [
            client_1.CustomerPaymentMethod.BANK_TRANSFER,
            client_1.CustomerPaymentMethod.CARD,
            client_1.CustomerPaymentMethod.CHECK,
        ];
        const isBankingPayment = BANKING_METHODS.includes(paymentMethod);
        if (isBankingPayment && !bankAccountId) {
            throw new common_1.BadRequestException('Un compte bancaire doit être sélectionné pour ce mode de paiement.');
        }
        const paymentAmount = new library_1.Decimal(amount);
        const payment = await this.prisma.$transaction(async (tx) => {
            if (!user.subsidiaryId) {
                throw new common_1.ForbiddenException('Filiale requise pour enregistrer un paiement.');
            }
            const order = await tx.order.findUnique({
                where: { id, subsidiaryId: user.subsidiaryId },
                include: {
                    orderItems: { include: { product: true } },
                    customer: { select: orderCustomerSelect },
                },
            });
            if (!order) {
                throw new common_1.NotFoundException(`Commande avec l'ID "${id}" non trouvée.`);
            }
            if (order.status === 'CANCELLED') {
                throw new common_1.ConflictException("Le paiement d'une commande annulée n'est pas autorisé.");
            }
            const newAmountPaid = order.amountPaid.add(paymentAmount);
            if (newAmountPaid.greaterThan(order.totalAmount)) {
                throw new common_1.BadRequestException('Le montant payé ne peut pas dépasser le total de la commande.');
            }
            const remainingBalance = order.totalAmount.sub(newAmountPaid);
            const newPaymentStatus = remainingBalance.isZero()
                ? client_1.PaymentStatus.PAID
                : client_1.PaymentStatus.PARTIALLY_PAID;
            const updateCount = await tx.order.updateMany({
                where: {
                    id,
                    subsidiaryId: user.subsidiaryId,
                    status: order.status,
                    amountPaid: order.amountPaid,
                    paymentStatus: order.paymentStatus,
                },
                data: {
                    amountPaid: newAmountPaid,
                    paymentStatus: newPaymentStatus,
                    paymentMethod: paymentMethod,
                },
            });
            if (updateCount.count === 0) {
                throw new common_1.ConflictException('Cette commande a été modifiée entre-temps. Veuillez réessayer.');
            }
            if (isBankingPayment && bankAccountId) {
                const bankAccount = await tx.treasuryAccount.findFirst({
                    where: {
                        id: bankAccountId,
                        subsidiaryId: order.subsidiaryId,
                        accountType: 'BANQUE',
                    },
                });
                if (!bankAccount) {
                    throw new common_1.NotFoundException(`Compte bancaire ${bankAccountId} introuvable pour cette filiale.`);
                }
                await tx.financialTransaction.create({
                    data: {
                        transactionDate: new Date(),
                        description: `Encaissement ${paymentMethod} — Commande ${order.id} — ${order.customer?.contactName || ''}`,
                        amount: paymentAmount,
                        relatedDocumentId: order.id,
                        subsidiaryId: order.subsidiaryId,
                        financialTransactionType: client_1.TransactionType.RECETTE,
                        treasuryAccountId: bankAccountId,
                        status: client_1.TransactionStatus.EN_ATTENTE,
                        reference: transactionReference || null,
                    },
                });
            }
            const updatedOrder = await tx.order.findUniqueOrThrow({
                where: { id },
                include: {
                    orderItems: { include: { product: true } },
                    customer: { select: orderCustomerSelect },
                },
            });
            if (newPaymentStatus === client_1.PaymentStatus.PAID) {
                const salesToCreate = updatedOrder.orderItems.map((item) => {
                    if (!item.product) {
                        throw new common_1.InternalServerErrorException(`Produit manquant pour l'article de commande ${item.id}`);
                    }
                    return {
                        id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.SALE),
                        productName: item.product.name,
                        quantity: item.quantity,
                        totalPrice: new library_1.Decimal(item.unitPrice).mul(item.quantity),
                        saleDate: new Date(),
                        customerName: updatedOrder.customer.contactName,
                        taxRate: updatedOrder.taxRateValue,
                        paymentMethod: updatedOrder.paymentMethod || paymentMethod,
                        customerId: updatedOrder.customerId,
                        subsidiaryId: updatedOrder.subsidiaryId,
                        salesRepId: updatedOrder.salesRepId,
                        orderId: updatedOrder.id,
                        status: client_1.SaleStatus.PAID,
                    };
                });
                await tx.sale.createMany({
                    data: salesToCreate,
                });
            }
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
    get orderFullInclude() {
        return {
            customer: { select: orderCustomerSelect },
            salesRep: { select: orderSalesRepSelect },
            taxRate: true,
            subsidiary: { select: { subsidiaryName: true } },
            orderItems: {
                include: {
                    product: true,
                    productOptions: true,
                    productionSteps: { orderBy: { stepOrder: 'asc' } },
                    productionSummary: true,
                },
            },
            productionHistory: { orderBy: { changeDate: 'asc' } },
        };
    }
    async validateForProduction(id, user) {
        return this.updateOrderStatus(id, { status: client_1.OrderStatus.IN_PRODUCTION }, user);
    }
    async rejectByProductionDirector(id, user) {
        return this.updateOrderStatus(id, { status: client_1.OrderStatus.CANCELLED }, user);
    }
    async findPendingValidation(user, subsidiaryId, paginationQuery = {}) {
        const isSuperAdmin = user.userRole === 'SUPER_ADMIN' || user.activeRole === 'SUPER_ADMIN';
        const where = {
            status: { in: order_workflow_1.BEFORE_PRODUCTION },
            ...(isSuperAdmin
                ? subsidiaryId
                    ? { subsidiaryId }
                    : {}
                : { subsidiaryId: user.subsidiaryId }),
        };
        return (0, pagination_1.paginate)(this.prisma.order, {
            where,
            include: this.orderFullInclude,
            orderBy: { orderDate: 'asc' },
        }, paginationQuery);
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        product_specs_service_1.ProductSpecsService,
        order_notifications_service_1.OrderNotificationsService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map