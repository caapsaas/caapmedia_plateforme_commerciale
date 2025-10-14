import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { CreatePurchaseOrderDto, RecordPurchasePaymentDto, UpdatePurchaseOrderStatusDto } from './dto/create-purchase-order.dto';
import { DebtStatus, PaymentStatus, Prisma, PurchaseOrderStatus, User, PaymentTerms } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { FindAllPurchaseOrdersDto, OrderPeriod } from './dto/find-all-purchase-orders.dto';
import { sub, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns';
import { ReceiveItemsDto } from './dto/receive-items.dto';

@Injectable()
export class PurchaseOrdersService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Créer un bon de commande fournisseur
     * @param createPurchaseOrderDto Dto de création de bon de commande
     * @param user Utilisateur connecté
     * @returns Bon de commande créé
     */
    async create(createPurchaseOrderDto: CreatePurchaseOrderDto, authenticatedUser: User) {
        const { supplierId, expectedDeliveryDate, paymentTerms, items } = createPurchaseOrderDto;
        const { subsidiaryId } = authenticatedUser;

        if (!items || items.length === 0) {
            throw new BadRequestException('Un bon de commande doit contenir au moins un article.');
        }

        return this.prisma.$transaction(async (tx) => {
            // Récupérer le nom complet de l'utilisateur pour l'historique
            const fullUser = await tx.user.findUnique({
                where: { id: authenticatedUser.id },
                select: { userName: true },
            });
            if (!fullUser) {
                throw new NotFoundException('Utilisateur authentifié non trouvé.');
            }
            const userNameForHistory = fullUser.userName;

            // 1. Valider le fournisseur
            const supplier = await tx.supplier.findUnique({
                where: { id: supplierId },
            });

            if (!supplier || supplier.subsidiaryId !== subsidiaryId) {
                throw new NotFoundException(`Fournisseur avec l'ID "${supplierId}" non trouvé dans cette filiale.`);
            }

            // 2. Valider les produits et calculer le montant total
            const productIds = items.map(item => item.productId);
            const products = await tx.product.findMany({
                where: { id: { in: productIds } },
            });

            if (products.length !== productIds.length) {
                throw new NotFoundException('Un ou plusieurs produits sont introuvables.');
            }

            const totalAmount = items.reduce((sum, item) => {
                const itemTotal = new Decimal(item.purchasePrice).mul(item.quantity);
                return sum.add(itemTotal);
            }, new Decimal(0));

            // 3. Créer le bon de commande et ses dépendances
            const purchaseOrder = await tx.purchaseOrder.create({
                data: {
                    supplierName: supplier.supplierName,
                    orderDate: new Date(),
                    expectedDeliveryDate: new Date(expectedDeliveryDate),
                    totalAmount,
                    amountPaid: 0,
                    status: PurchaseOrderStatus.ORDERED,
                    paymentStatus: PaymentStatus.UNPAID,
                    paymentTerms,
                    supplier: { connect: { id: supplierId } },
                    subsidiary: { connect: { id: subsidiaryId } },
                    purchaseOrderItems: {
                        create: items.map(item => ({
                            productName: products.find(p => p.id === item.productId)?.productName || 'Produit inconnu', // Ajout d'une valeur par défaut
                            quantity: item.quantity,
                            quantityReceived: 0,
                            purchasePrice: item.purchasePrice,
                            productId: item.productId,
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

            // 4. Si les termes de paiement sont à crédit, créer la dette fournisseur
            if (paymentTerms === PaymentTerms.CREDIT) {
                await tx.supplierDebt.create({
                    data: {
                        supplierName: supplier.supplierName,
                        invoiceId: `PO-${purchaseOrder.id.substring(0, 8)}`,
                        dueDate: new Date(expectedDeliveryDate),
                        amount: totalAmount,
                        status: DebtStatus.A_PAYER,
                        purchaseOrderId: purchaseOrder.id,
                        subsidiaryId: subsidiaryId,
                    },
                });
            }

            return purchaseOrder;
        });
    }

    /**
     * Trouver tous les bons de commande
     * @param user Utilisateur connecté
     * @param query Paramètres de recherche
     * @returns Liste des bons de commande
     */
    async findAll(user: User, query: FindAllPurchaseOrdersDto) {
        const { supplierId, status, paymentStatus, period, startDate, endDate } = query;
        const where: Prisma.PurchaseOrderWhereInput = {
            subsidiaryId: user.subsidiaryId,
        };

        if (supplierId) where.supplierId = supplierId;
        if (status) where.status = status;
        if (paymentStatus) where.paymentStatus = paymentStatus;

        if (period && period !== OrderPeriod.ALL_TIME) {
            const now = new Date();
            let dateFilter: { gte?: Date; lte?: Date } = {};

            if (period === OrderPeriod.THIS_MONTH) dateFilter = { gte: startOfMonth(now), lte: endOfMonth(now) };
            else if (period === OrderPeriod.LAST_MONTH) {
                const lastMonth = subMonths(now, 1);
                dateFilter = { gte: startOfMonth(lastMonth), lte: endOfMonth(lastMonth) };
            }
            else if (period === OrderPeriod.LAST_7_DAYS) dateFilter = { gte: sub(now, { days: 7 }) };
            else if (period === OrderPeriod.LAST_30_DAYS) dateFilter = { gte: sub(now, { days: 30 }) };
            else if (period === OrderPeriod.THIS_YEAR) dateFilter = { gte: startOfYear(now), lte: endOfYear(now) };
            else if (period === OrderPeriod.CUSTOM) {
                if (!startDate || !endDate) throw new BadRequestException('Pour une période personnalisée, les dates de début et de fin sont requises.');
                dateFilter = { gte: new Date(startDate), lte: new Date(endDate) };
            }
            where.orderDate = dateFilter;
        }

        return this.prisma.purchaseOrder.findMany({
            where,
            include: { supplier: true, purchaseOrderItems: true },
            orderBy: { orderDate: 'desc' },
        });
    }

    /**
     * Trouver un bon de commande par son ID
     * @param id ID du bon de commande
     * @param user Utilisateur connecté
     * @returns Bon de commande trouvé
     */
    async findOne(id: string, user: User) {
        const purchaseOrder = await this.prisma.purchaseOrder.findUnique({
            where: { id },
            include: {
                supplier: true,
                purchaseOrderItems: { include: { product: true } },
                purchaseOrderHistory: { orderBy: { eventDate: 'desc' } },
            },
        });

        if (!purchaseOrder || purchaseOrder.subsidiaryId !== user.subsidiaryId) {
            throw new NotFoundException(`Bon de commande avec l'ID "${id}" non trouvé.`);
        }
        return purchaseOrder;
    }

    /**
     * Recevoir des articles pour un bon de commande
     * @param id ID du bon de commande
     * @param receiveItemsDto Dto de réception des articles
     * @param user Utilisateur connecté
     * @returns Bon de commande mis à jour
     */
    async receiveItems(id: string, receiveItemsDto: ReceiveItemsDto, user: User) {
        return this.prisma.$transaction(async (tx) => {
            const order = await tx.purchaseOrder.findUnique({
                where: { id },
                include: { purchaseOrderItems: true },
            });

            if (!order || order.subsidiaryId !== user.subsidiaryId) {
                throw new NotFoundException(`Bon de commande avec l'ID "${id}" non trouvé.`);
            }

            for (const item of receiveItemsDto.items) {
                const orderItem = order.purchaseOrderItems.find(oi => oi.id === item.purchaseOrderItemId);
                if (!orderItem) {
                    throw new BadRequestException(`Article de commande avec l'ID "${item.purchaseOrderItemId}" non trouvé.`);
                }

                const newQuantityReceived = orderItem.quantityReceived + item.quantityReceived;
                if (newQuantityReceived > orderItem.quantity) {
                    throw new BadRequestException(`La quantité reçue pour "${orderItem.productName}" dépasse la quantité commandée.`);
                }

                // Mettre à jour la quantité reçue pour l'article
                await tx.purchaseOrderItem.update({
                    where: { id: orderItem.id },
                    data: { quantityReceived: { increment: item.quantityReceived } },
                });

                // Mettre à jour le stock et potentiellement le prix d'achat du produit
                const product = await tx.product.findUnique({ where: { id: orderItem.productId } });
                const dataToUpdate: Prisma.ProductUpdateInput = {
                    stock: { increment: item.quantityReceived }
                };

                if (product && product.price.comparedTo(orderItem.purchasePrice) !== 0) {
                    dataToUpdate.price = orderItem.purchasePrice;
                }

                await tx.product.update({
                    where: { id: orderItem.productId },
                    data: dataToUpdate,
                });
            }

            // Mettre à jour le statut global de la commande
            const updatedOrderItems = await tx.purchaseOrderItem.findMany({
                where: { purchaseOrderId: id },
            });

            const allReceived = updatedOrderItems.every(item => item.quantityReceived >= item.quantity);
            const someReceived = updatedOrderItems.some(item => item.quantityReceived > 0);

            let newStatus = order.status;
            if (allReceived) {
                newStatus = PurchaseOrderStatus.RECEIVED;
            } else if (someReceived) {
                newStatus = PurchaseOrderStatus.PARTIALLY_RECEIVED;
            }

            const updatedOrder = await tx.purchaseOrder.update({
                where: { id },
                data: { status: newStatus },
            });

            // Ajouter à l'historique
            await tx.purchaseOrderHistory.create({
                data: {
                    purchaseOrderId: id,
                    eventName: `Réception de ${receiveItemsDto.items.length} article(s) par ${user.userName}`,
                },
            });

            return updatedOrder;
        });
    }

    /**
     * Mettre à jour le montant payé pour un bon de commande
     * @param id ID du bon de commande
     * @param recordPaymentDto Dto de paiement
     * @param user Utilisateur connecté
     * @returns Bon de commande mis à jour
     */
    async recordPayment(id: string, recordPaymentDto: RecordPurchasePaymentDto, user: User) {
        const { amount } = recordPaymentDto;
        const paymentAmount = new Decimal(amount);

        return this.prisma.$transaction(async (tx) => {
            const order = await this.findOne(id, user); // Utilise findOne pour la validation

            const newAmountPaid = order.amountPaid.add(paymentAmount);
            if (newAmountPaid.greaterThan(order.totalAmount)) {
                throw new BadRequestException('Le montant payé ne peut pas dépasser le total de la commande.');
            }

            const newPaymentStatus = newAmountPaid.gte(order.totalAmount)
                ? PaymentStatus.PAID
                : PaymentStatus.PARTIALLY_PAID;

            // Mettre à jour le bon de commande
            const updatedOrder = await tx.purchaseOrder.update({
                where: { id },
                data: {
                    amountPaid: newAmountPaid,
                    paymentStatus: newPaymentStatus,
                },
            });

            // Créer ou mettre à jour la dette fournisseur
            const debt = await tx.supplierDebt.findFirst({
                where: { purchaseOrderId: id },
            });

            const debtStatus = newPaymentStatus === PaymentStatus.PAID ? DebtStatus.PAYER : DebtStatus.A_PAYER;

            if (debt) {
                await tx.supplierDebt.update({
                    where: { id: debt.id },
                    data: {
                        amount: order.totalAmount.sub(newAmountPaid),
                        status: debtStatus,
                    },
                });
            } else {
                await tx.supplierDebt.create({
                    data: {
                        supplierName: order.supplierName,
                        invoiceId: `PO-${order.id.substring(0, 8)}`, // ID de facture basé sur le PO
                        dueDate: order.expectedDeliveryDate,
                        amount: order.totalAmount.sub(newAmountPaid),
                        status: debtStatus,
                        purchaseOrderId: id,
                        subsidiaryId: user.subsidiaryId,
                    },
                });
            }

            // Ajouter à l'historique
            await tx.purchaseOrderHistory.create({
                data: {
                    purchaseOrderId: id,
                    eventName: `Paiement de ${amount} enregistré par ${user.userName}`,
                },
            });

            return updatedOrder;
        });
    }

    /**
     * Mettre à jour le statut d'un bon de commande
     * @param id ID du bon de commande
     * @param updateStatusDto Dto de mise à jour du statut
     * @param user Utilisateur connecté
     * @returns Bon de commande mis à jour
     */
    async updateStatus(id: string, updateStatusDto: UpdatePurchaseOrderStatusDto, user: User) {
        const { status } = updateStatusDto;
        await this.findOne(id, user); // Valide l'existence et les droits

        return this.prisma.$transaction(async (tx) => {
            const updatedOrder = await tx.purchaseOrder.update({
                where: { id },
                data: { status },
            });

            await tx.purchaseOrderHistory.create({
                data: {
                    purchaseOrderId: id,
                    eventName: `Statut changé à ${status} par ${user.userName}`,
                },
            });

            return updatedOrder;
        });
    }
}
