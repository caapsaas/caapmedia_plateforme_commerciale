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
exports.PurchaseOrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const client_1 = require("@prisma/client");
const pagination_1 = require("../../common/pagination/pagination");
const library_1 = require("@prisma/client/runtime/library");
const find_all_purchase_orders_dto_1 = require("./dto/find-all-purchase-orders.dto");
const date_fns_1 = require("date-fns");
const generate_id_util_1 = require("../../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../../common/constants/id-prefixes.const");
const purchaseOrderInclude = {
    supplier: true,
    subsidiary: true,
    purchaseOrderItems: {
        include: {
            purchaseUnit: true,
            product: { include: { baseUnit: true } },
        },
    },
    purchaseOrderHistory: { orderBy: { eventDate: 'desc' } },
    supplierDebts: true,
};
let PurchaseOrdersService = class PurchaseOrdersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createPurchaseOrderDto, authenticatedUser) {
        const { supplierId, expectedDeliveryDate, paymentTerms, items } = createPurchaseOrderDto;
        const { subsidiaryId } = authenticatedUser;
        if (!items || items.length === 0) {
            throw new common_1.BadRequestException('Un bon de commande doit contenir au moins un article.');
        }
        return this.prisma.$transaction(async (tx) => {
            const fullUser = await tx.user.findUnique({
                where: { id: authenticatedUser.id },
                select: { userName: true },
            });
            if (!fullUser) {
                throw new common_1.NotFoundException('Utilisateur authentifié non trouvé.');
            }
            const userNameForHistory = fullUser.userName;
            const supplier = await tx.supplier.findUnique({
                where: { id: supplierId },
            });
            if (!supplier || supplier.subsidiaryId !== subsidiaryId) {
                throw new common_1.NotFoundException(`Fournisseur avec l'ID "${supplierId}" non trouvé dans cette filiale.`);
            }
            const productIds = items.map((item) => item.productId);
            const products = await tx.item.findMany({
                where: { id: { in: productIds }, type: client_1.ItemType.STOCK_PRODUCT },
            });
            if (products.length !== productIds.length) {
                throw new common_1.NotFoundException('Un ou plusieurs produits sont introuvables.');
            }
            const totalAmount = items.reduce((sum, item) => {
                const itemTotal = new library_1.Decimal(item.purchasePrice).mul(item.quantity);
                return sum.add(itemTotal);
            }, new library_1.Decimal(0));
            const purchaseOrder = await tx.purchaseOrder.create({
                data: {
                    supplierName: supplier.supplierName,
                    orderDate: new Date(),
                    expectedDeliveryDate: new Date(expectedDeliveryDate),
                    totalAmount,
                    amountPaid: 0,
                    status: client_1.PurchaseOrderStatus.ORDERED,
                    paymentStatus: client_1.PaymentStatus.UNPAID,
                    paymentTerms,
                    supplier: { connect: { id: supplierId } },
                    subsidiary: { connect: { id: subsidiaryId } },
                    purchaseOrderItems: {
                        create: items.map((item) => ({
                            productName: products.find((p) => p.id === item.productId)?.name ||
                                'Produit inconnu',
                            quantity: item.quantity,
                            quantityReceived: 0,
                            purchasePrice: item.purchasePrice,
                            productId: item.productId,
                            purchaseUnitId: item.purchaseUnitId,
                        })),
                    },
                    purchaseOrderHistory: {
                        create: {
                            eventName: `Bon de commande créé par ${userNameForHistory}`,
                        },
                    },
                },
                include: {
                    purchaseOrderItems: true,
                    purchaseOrderHistory: true,
                },
            });
            await tx.supplierDebt.create({
                data: {
                    supplierName: supplier.supplierName,
                    invoiceId: `PO-${purchaseOrder.id.substring(0, 8)}`,
                    dueDate: new Date(expectedDeliveryDate),
                    amount: totalAmount,
                    status: client_1.DebtStatus.A_PAYER,
                    purchaseOrderId: purchaseOrder.id,
                    subsidiaryId: subsidiaryId,
                },
            });
            return purchaseOrder;
        });
    }
    async findAll(user, query) {
        const { subsidiaryId: filterSubsidiaryId, supplierId, status, paymentStatus, period, startDate, endDate, } = query;
        const isSuperAdmin = user.userRole === 'SUPER_ADMIN';
        const where = isSuperAdmin
            ? filterSubsidiaryId
                ? { subsidiaryId: filterSubsidiaryId }
                : {}
            : { subsidiaryId: user.subsidiaryId };
        if (supplierId)
            where.supplierId = supplierId;
        if (status)
            where.status = status;
        if (paymentStatus)
            where.paymentStatus = paymentStatus;
        if (period && period !== find_all_purchase_orders_dto_1.OrderPeriod.ALL_TIME) {
            const now = new Date();
            let dateFilter = {};
            if (period === find_all_purchase_orders_dto_1.OrderPeriod.THIS_MONTH)
                dateFilter = { gte: (0, date_fns_1.startOfMonth)(now), lte: (0, date_fns_1.endOfMonth)(now) };
            else if (period === find_all_purchase_orders_dto_1.OrderPeriod.LAST_MONTH) {
                const lastMonth = (0, date_fns_1.subMonths)(now, 1);
                dateFilter = {
                    gte: (0, date_fns_1.startOfMonth)(lastMonth),
                    lte: (0, date_fns_1.endOfMonth)(lastMonth),
                };
            }
            else if (period === find_all_purchase_orders_dto_1.OrderPeriod.LAST_7_DAYS)
                dateFilter = { gte: (0, date_fns_1.sub)(now, { days: 7 }) };
            else if (period === find_all_purchase_orders_dto_1.OrderPeriod.LAST_30_DAYS)
                dateFilter = { gte: (0, date_fns_1.sub)(now, { days: 30 }) };
            else if (period === find_all_purchase_orders_dto_1.OrderPeriod.LAST_90_DAYS)
                dateFilter = { gte: (0, date_fns_1.sub)(now, { days: 90 }) };
            else if (period === find_all_purchase_orders_dto_1.OrderPeriod.THIS_YEAR)
                dateFilter = { gte: (0, date_fns_1.startOfYear)(now), lte: (0, date_fns_1.endOfYear)(now) };
            else if (period === find_all_purchase_orders_dto_1.OrderPeriod.CUSTOM) {
                if (!startDate || !endDate)
                    throw new common_1.BadRequestException('Pour une période personnalisée, les dates de début et de fin sont requises.');
                dateFilter = { gte: new Date(startDate), lte: new Date(endDate) };
            }
            where.orderDate = dateFilter;
        }
        const result = await (0, pagination_1.paginate)(this.prisma.purchaseOrder, {
            where,
            include: purchaseOrderInclude,
            orderBy: { orderDate: 'desc' },
        }, query);
        return {
            ...result,
            data: result.data.map((po) => this.mapToResponse(po)),
        };
    }
    async findOne(id, user) {
        const purchaseOrder = await this.prisma.purchaseOrder.findUnique({
            where: { id },
            include: purchaseOrderInclude,
        });
        const isSuperAdmin = user.userRole === 'SUPER_ADMIN';
        if (!purchaseOrder ||
            (!isSuperAdmin && purchaseOrder.subsidiaryId !== user.subsidiaryId)) {
            throw new common_1.NotFoundException(`Bon de commande avec l'ID "${id}" non trouvé.`);
        }
        return this.mapToResponse(purchaseOrder);
    }
    mapToResponse(po) {
        return {
            ...po,
            totalAmount: Number(po.totalAmount),
            amountPaid: Number(po.amountPaid),
            subsidiary: po.subsidiary
                ? { id: po.subsidiary.id, subsidiaryName: po.subsidiary.subsidiaryName }
                : undefined,
            items: po.purchaseOrderItems.map((item) => ({
                ...item,
                purchasePrice: Number(item.purchasePrice),
            })),
            history: po.purchaseOrderHistory.map((h) => ({
                date: h.eventDate,
                event: h.eventName,
            })),
            supplierDebts: po.supplierDebts.map((d) => ({
                ...d,
                amount: Number(d.amount),
            })),
        };
    }
    async receiveItems(id, receiveItemsDto, authenticatedUser) {
        const { subsidiaryId } = authenticatedUser;
        return this.prisma.$transaction(async (tx) => {
            const order = await tx.purchaseOrder.findUnique({
                where: { id },
                include: { purchaseOrderItems: true },
            });
            const fullUser = await tx.user.findUnique({
                where: { id: authenticatedUser.id },
                select: { userName: true },
            });
            if (!fullUser) {
                throw new common_1.NotFoundException('Utilisateur authentifié non trouvé.');
            }
            const userNameForHistory = fullUser.userName;
            if (!order || order.subsidiaryId !== subsidiaryId) {
                throw new common_1.NotFoundException(`Bon de commande avec l'ID "${id}" non trouvé.`);
            }
            for (const item of receiveItemsDto.items) {
                const orderItem = order.purchaseOrderItems.find((oi) => oi.id === item.purchaseOrderItemId);
                if (!orderItem) {
                    throw new common_1.BadRequestException(`Article de commande avec l'ID "${item.purchaseOrderItemId}" non trouvé.`);
                }
                const newQuantityReceived = orderItem.quantityReceived + item.quantityReceived;
                if (newQuantityReceived > orderItem.quantity) {
                    throw new common_1.BadRequestException(`La quantité reçue pour "${orderItem.productName}" dépasse la quantité commandée.`);
                }
                await tx.purchaseOrderItem.update({
                    where: { id: orderItem.id },
                    data: { quantityReceived: { increment: item.quantityReceived } },
                });
                let baseQuantityReceived = new library_1.Decimal(item.quantityReceived);
                if (orderItem.purchaseUnitId) {
                    const packagingUnit = await tx.itemPackagingUnit.findUnique({
                        where: {
                            itemId_unitId: {
                                itemId: orderItem.productId,
                                unitId: orderItem.purchaseUnitId,
                            },
                        },
                    });
                    if (packagingUnit) {
                        baseQuantityReceived = baseQuantityReceived.mul(packagingUnit.conversionFactor);
                    }
                }
                await tx.itemStock.upsert({
                    where: {
                        itemId_subsidiaryId: {
                            itemId: orderItem.productId,
                            subsidiaryId: order.subsidiaryId,
                        },
                    },
                    update: { stock: { increment: baseQuantityReceived } },
                    create: {
                        id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ITEMSTOCK),
                        itemId: orderItem.productId,
                        subsidiaryId: order.subsidiaryId,
                        stock: baseQuantityReceived,
                    },
                });
                await tx.stockMovement.create({
                    data: {
                        id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.STOCKMOVEMENT),
                        itemId: orderItem.productId,
                        subsidiaryId: order.subsidiaryId,
                        type: 'PURCHASE_RECEIPT',
                        quantity: baseQuantityReceived,
                        purchaseOrderId: order.id,
                        createdById: authenticatedUser.id,
                    },
                });
            }
            const updatedOrderItems = await tx.purchaseOrderItem.findMany({
                where: { purchaseOrderId: id },
            });
            const allReceived = updatedOrderItems.every((item) => item.quantityReceived >= item.quantity);
            const someReceived = updatedOrderItems.some((item) => item.quantityReceived > 0);
            let newStatus = order.status;
            if (allReceived) {
                newStatus = client_1.PurchaseOrderStatus.RECEIVED;
            }
            else if (someReceived) {
                newStatus = client_1.PurchaseOrderStatus.PARTIALLY_RECEIVED;
            }
            const updatedOrder = await tx.purchaseOrder.update({
                where: { id },
                data: { status: newStatus },
            });
            await tx.purchaseOrderHistory.create({
                data: {
                    purchaseOrderId: id,
                    eventName: `Réception de ${receiveItemsDto.items.length} article(s) par ${userNameForHistory}`,
                },
            });
            return updatedOrder;
        });
    }
    async updateStatus(id, updateStatusDto, authenticatedUser) {
        const { status } = updateStatusDto;
        await this.findOne(id, authenticatedUser);
        const fullUser = await this.prisma.user.findUnique({
            where: { id: authenticatedUser.id },
            select: { userName: true },
        });
        if (!fullUser) {
            throw new common_1.NotFoundException('Utilisateur authentifié non trouvé.');
        }
        const userNameForHistory = fullUser.userName;
        return this.prisma.$transaction(async (tx) => {
            const updatedOrder = await tx.purchaseOrder.update({
                where: { id },
                data: { status },
            });
            await tx.purchaseOrderHistory.create({
                data: {
                    purchaseOrderId: id,
                    eventName: `Statut changé à ${status} par ${userNameForHistory}`,
                },
            });
            return updatedOrder;
        });
    }
};
exports.PurchaseOrdersService = PurchaseOrdersService;
exports.PurchaseOrdersService = PurchaseOrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PurchaseOrdersService);
//# sourceMappingURL=purchase-orders.service.js.map