import { PrismaClient } from '@prisma/client';
import { generateId } from './generate-id.util';
import { ID_PREFIXES } from './id-prefixes.const';
import { OrderStatus, ProductionStatus, PaymentStatus, OrderSource } from '@prisma/client';

interface OrderItemData {
    quantity: number;
    unitPrice: number;
    productOptions?: {
        optionType: string;
        optionValue: string;
    }[];
}

interface OrderSeedData {
    customerEmail: string;
    customerName: string;
    subsidiaryEmail: string;
    salesRepEmail: string;
    items: OrderItemData[];
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    taxRateValue: number;
    status: OrderStatus;
    productionStatus?: ProductionStatus | null;
    paymentStatus: PaymentStatus;
    amountPaid: number;
    paymentDueDate: Date;
    source: OrderSource;
}

export async function runOrdersSeeder(prisma: PrismaClient) {
    const ordersData: OrderSeedData[] = [
        {
            customerEmail: 'hard.nata@example.com',
            customerName: 'NATA, hard (Caapfar)',
            subsidiaryEmail: 'contact.douala@caap.cm',
            salesRepEmail: 'jean.commercial@caap.cm',
            items: [
                {
                    quantity: 250,
                    unitPrice: 75,
                },
            ],
            subtotal: 18750,
            taxAmount: 3375,
            totalAmount: 22125,
            taxRateValue: 0.1925,
            status: OrderStatus.COMPLETED,
            productionStatus: ProductionStatus.READY_FOR_DELIVERY,
            paymentStatus: PaymentStatus.PAID,
            amountPaid: 22125,
            paymentDueDate: new Date('2024-07-20'),
            source: OrderSource.MANUAL,
        },
        // Ajouter d'autres commandes ici si nécessaire
    ];

    // Récupérer un produit existant pour les OrderItems
    const product = await prisma.product.findFirst();
    if (!product) throw new Error('Aucun produit trouvé pour créer un OrderItem');

    // Récupérer un taux de taxe existant pour les Orders
    const taxRate = await prisma.taxRate.findFirst();
    if (!taxRate) throw new Error('Aucun taux de taxe trouvé pour créer une Order');

    for (const o of ordersData) {
        // Récupérer le contact
        const contact = await prisma.contact.findUnique({
            where: { email: o.customerEmail },
        });
        if (!contact) {
            console.warn(`Contact non trouvé pour email ${o.customerEmail}`);
            continue;
        }

        // Récupérer la filiale
        const subsidiary = await prisma.subsidiary.findUnique({
            where: { email: o.subsidiaryEmail },
        });
        if (!subsidiary) {
            console.warn(`Filiale non trouvée pour email ${o.subsidiaryEmail}`);
            continue;
        }

        // Récupérer le commercial
        const salesRep = await prisma.user.findUnique({
            where: { email: o.salesRepEmail },
        });
        if (!salesRep) {
            console.warn(`Commercial non trouvé pour email ${o.salesRepEmail}`);
            continue;
        }

        const orderData: any = {
            customerId: contact.id,
            customerName: o.customerName,
            subtotal: o.subtotal,
            taxAmount: o.taxAmount,
            totalAmount: o.totalAmount,
            taxRateValue: o.taxRateValue,
            status: o.status,
            productionStatus: o.productionStatus,
            paymentStatus: o.paymentStatus,
            amountPaid: o.amountPaid,
            paymentDueDate: o.paymentDueDate,
            source: o.source,
            subsidiaryId: subsidiary.id,
            salesRepId: salesRep.id,
            taxRateId: taxRate.id,
            orderItems: {
                create: o.items.map(item => ({
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    productId: product.id,
                    ...(item.productOptions && {
                        productOptions: {
                            create: item.productOptions.map(opt => ({
                                optionType: opt.optionType,
                                optionValue: opt.optionValue,
                            })),
                        },
                    }),
                })),
            },
        };

        if (o.productionStatus) {
            orderData.productionHistory = {
                create: [{ status: o.productionStatus }],
            };
        }

        // Créer l'ordre avec OrderItems, ProductOptions et OrderProductionHistory
        const order = await prisma.order.create({ data: orderData });

        console.log(`Order ${order.id} créé pour ${contact.email}`);
    }
}
