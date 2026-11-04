"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPurchaseOrderSeeder = runPurchaseOrderSeeder;
const client_1 = require("@prisma/client");
const generate_id_util_1 = require("./generate-id.util");
const id_prefixes_const_1 = require("./id-prefixes.const");
const product_seeder_1 = require("./product.seeder");
const CONFIGS = [
    {
        subsidiaryEmail: 'contact.douala@caap.cm',
        orders: [
            {
                supplierName: 'ORANGE',
                items: [
                    {
                        productName: 'Cartons pour emballage',
                        quantity: 40,
                        purchasePrice: 5000,
                    },
                ],
                daysAgo: 10,
                paymentTerms: client_1.PaymentTerms.CREDIT,
                amountPaidRatio: 0,
            },
            {
                supplierName: 'Eneo',
                items: [
                    {
                        productName: 'Plaques pour Insoleuse',
                        quantity: 15,
                        purchasePrice: 12000,
                    },
                ],
                daysAgo: 22,
                paymentTerms: client_1.PaymentTerms.CREDIT,
                amountPaidRatio: 0.5,
            },
            {
                supplierName: 'SONARA',
                items: [{ productName: 'Agrafes', quantity: 100, purchasePrice: 500 }],
                daysAgo: 40,
                paymentTerms: client_1.PaymentTerms.IMMEDIATE,
                amountPaidRatio: 1,
            },
        ],
    },
    {
        subsidiaryEmail: 'contact.siege@caap.cm',
        orders: [
            {
                supplierName: 'CAMTEL',
                items: [
                    {
                        productName: 'Cartons pour emballage',
                        quantity: 20,
                        purchasePrice: 5000,
                    },
                ],
                daysAgo: 8,
                paymentTerms: client_1.PaymentTerms.CREDIT,
                amountPaidRatio: 0,
            },
            {
                supplierName: 'CAMWATER',
                items: [{ productName: 'Agrafes', quantity: 60, purchasePrice: 500 }],
                daysAgo: 18,
                paymentTerms: client_1.PaymentTerms.CREDIT,
                amountPaidRatio: 0.4,
            },
        ],
    },
    {
        subsidiaryEmail: 'contact.kribi@caap.cm',
        orders: [
            {
                supplierName: 'GUINNESS',
                items: [
                    {
                        productName: 'Plaques pour Insoleuse',
                        quantity: 10,
                        purchasePrice: 12000,
                    },
                ],
                daysAgo: 12,
                paymentTerms: client_1.PaymentTerms.CREDIT,
                amountPaidRatio: 0,
            },
            {
                supplierName: 'TCHIBOBO',
                items: [
                    {
                        productName: 'Cartons pour emballage',
                        quantity: 30,
                        purchasePrice: 5000,
                    },
                ],
                daysAgo: 27,
                paymentTerms: client_1.PaymentTerms.CREDIT,
                amountPaidRatio: 0.6,
            },
        ],
    },
    {
        subsidiaryEmail: 'contact.edea@caap.cm',
        orders: [
            {
                supplierName: 'CDC',
                items: [{ productName: 'Agrafes', quantity: 80, purchasePrice: 500 }],
                daysAgo: 15,
                paymentTerms: client_1.PaymentTerms.CREDIT,
                amountPaidRatio: 0,
            },
            {
                supplierName: 'CDC',
                items: [
                    {
                        productName: 'Plaques pour Insoleuse',
                        quantity: 8,
                        purchasePrice: 12000,
                    },
                ],
                daysAgo: 33,
                paymentTerms: client_1.PaymentTerms.CREDIT,
                amountPaidRatio: 0.3,
            },
        ],
    },
];
const OPENING_STOCK_SUPPLIER = {
    supplierName: 'Fournisseur Stock Initial',
    company: 'Stock Initial (solde d\'ouverture)',
    email: 'stock-initial@caap.cm',
    phone: '2333330099',
    address: 'N/A',
};
const OPENING_STOCK_DAYS_AGO = 90;
async function seedOpeningStockPurchases(prisma) {
    const priceByName = new Map();
    for (const p of product_seeder_1.STOCK_PRODUCTS_DATA) {
        if (!priceByName.has(p.name)) {
            priceByName.set(p.name, p.price);
        }
    }
    const allStockItems = await prisma.item.findMany({
        where: { type: client_1.ItemType.STOCK_PRODUCT },
        select: { id: true, name: true },
    });
    if (allStockItems.length === 0) {
        console.warn('Aucun article de stock en base — seedOpeningStockPurchases ignoré.');
        return;
    }
    const subsidiaries = await prisma.subsidiary.findMany();
    for (const subsidiary of subsidiaries) {
        const supplier = await prisma.supplier.upsert({
            where: {
                supplierName_subsidiaryId: {
                    supplierName: OPENING_STOCK_SUPPLIER.supplierName,
                    subsidiaryId: subsidiary.id,
                },
            },
            update: {},
            create: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.SUPPLIER),
                supplierName: OPENING_STOCK_SUPPLIER.supplierName,
                company: OPENING_STOCK_SUPPLIER.company,
                email: OPENING_STOCK_SUPPLIER.email,
                phone: OPENING_STOCK_SUPPLIER.phone,
                address: OPENING_STOCK_SUPPLIER.address,
                subsidiaryId: subsidiary.id,
            },
        });
        const existing = await prisma.purchaseOrder.findFirst({
            where: { supplierId: supplier.id, subsidiaryId: subsidiary.id },
        });
        if (existing)
            continue;
        const itemsData = [];
        let totalAmount = 0;
        for (const item of allStockItems) {
            const purchasePrice = priceByName.get(item.name) ?? 5000;
            itemsData.push({
                productName: item.name,
                quantity: 50,
                quantityReceived: 50,
                purchasePrice,
                productId: item.id,
            });
            totalAmount += 50 * purchasePrice;
        }
        const orderDate = new Date();
        orderDate.setDate(orderDate.getDate() - OPENING_STOCK_DAYS_AGO);
        const expectedDeliveryDate = new Date(orderDate);
        expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 7);
        const purchaseOrder = await prisma.purchaseOrder.create({
            data: {
                supplierName: supplier.supplierName,
                orderDate,
                expectedDeliveryDate,
                totalAmount,
                amountPaid: totalAmount,
                status: client_1.PurchaseOrderStatus.RECEIVED,
                paymentTerms: client_1.PaymentTerms.IMMEDIATE,
                paymentStatus: client_1.PaymentStatus.PAID,
                supplier: { connect: { id: supplier.id } },
                subsidiary: { connect: { id: subsidiary.id } },
                purchaseOrderItems: { create: itemsData },
                purchaseOrderHistory: {
                    create: {
                        eventName: "Bon de commande créé (seed — solde d'ouverture)",
                    },
                },
            },
        });
        await prisma.supplierDebt.create({
            data: {
                supplierName: supplier.supplierName,
                invoiceId: `PO-${purchaseOrder.id.substring(0, 8)}`,
                dueDate: expectedDeliveryDate,
                amount: 0,
                status: client_1.DebtStatus.PAYER,
                purchaseOrderId: purchaseOrder.id,
                subsidiaryId: subsidiary.id,
            },
        });
        console.log(`BO d'ouverture ${purchaseOrder.id} créé — ${itemsData.length} articles pour « ${subsidiary.subsidiaryName ?? subsidiary.id} »`);
    }
    console.log("Prix de revient initiaux (solde d'ouverture) seedés");
}
async function runPurchaseOrderSeeder(prisma) {
    await seedOpeningStockPurchases(prisma);
    for (const config of CONFIGS) {
        const subsidiary = await prisma.subsidiary.findUnique({
            where: { email: config.subsidiaryEmail },
        });
        if (!subsidiary) {
            console.warn(`Filiale introuvable pour ${config.subsidiaryEmail}, bons de commande ignorés`);
            continue;
        }
        for (const o of config.orders) {
            const supplier = await prisma.supplier.findFirst({
                where: { supplierName: o.supplierName, subsidiaryId: subsidiary.id },
            });
            if (!supplier) {
                console.warn(`Fournisseur "${o.supplierName}" introuvable pour ${config.subsidiaryEmail}, bon de commande ignoré`);
                continue;
            }
            const orderDate = new Date();
            orderDate.setDate(orderDate.getDate() - o.daysAgo);
            const expectedDeliveryDate = new Date(orderDate);
            expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 14);
            const itemsData = [];
            let totalAmount = 0;
            let skip = false;
            for (const item of o.items) {
                const product = await prisma.item.findFirst({
                    where: { name: item.productName, type: client_1.ItemType.STOCK_PRODUCT },
                });
                if (!product) {
                    console.warn(`Article de stock "${item.productName}" introuvable, bon de commande pour ${o.supplierName} ignoré`);
                    skip = true;
                    break;
                }
                itemsData.push({
                    productName: item.productName,
                    quantity: item.quantity,
                    quantityReceived: 0,
                    purchasePrice: item.purchasePrice,
                    productId: product.id,
                });
                totalAmount += item.quantity * item.purchasePrice;
            }
            if (skip || itemsData.length === 0)
                continue;
            const existing = await prisma.purchaseOrder.findFirst({
                where: {
                    supplierId: supplier.id,
                    subsidiaryId: subsidiary.id,
                    purchaseOrderItems: { some: { productId: itemsData[0].productId } },
                },
            });
            if (existing)
                continue;
            const amountPaid = Math.round(totalAmount * o.amountPaidRatio);
            const paymentStatus = o.amountPaidRatio >= 1
                ? client_1.PaymentStatus.PAID
                : o.amountPaidRatio > 0
                    ? client_1.PaymentStatus.PARTIALLY_PAID
                    : client_1.PaymentStatus.UNPAID;
            const purchaseOrder = await prisma.purchaseOrder.create({
                data: {
                    supplierName: supplier.supplierName,
                    orderDate,
                    expectedDeliveryDate,
                    totalAmount,
                    amountPaid,
                    status: client_1.PurchaseOrderStatus.ORDERED,
                    paymentTerms: o.paymentTerms,
                    paymentStatus,
                    supplier: { connect: { id: supplier.id } },
                    subsidiary: { connect: { id: subsidiary.id } },
                    purchaseOrderItems: { create: itemsData },
                    purchaseOrderHistory: {
                        create: { eventName: 'Bon de commande créé (seed)' },
                    },
                },
            });
            const remainingAmount = totalAmount - amountPaid;
            await prisma.supplierDebt.create({
                data: {
                    supplierName: supplier.supplierName,
                    invoiceId: `PO-${purchaseOrder.id.substring(0, 8)}`,
                    dueDate: expectedDeliveryDate,
                    amount: remainingAmount,
                    status: remainingAmount <= 0
                        ? client_1.DebtStatus.PAYER
                        : amountPaid > 0
                            ? client_1.DebtStatus.PARTIELLEMENT_PAYE
                            : client_1.DebtStatus.A_PAYER,
                    purchaseOrderId: purchaseOrder.id,
                    subsidiaryId: subsidiary.id,
                },
            });
            console.log(`Bon de commande ${purchaseOrder.id} créé pour ${o.supplierName} (${config.subsidiaryEmail}) — ${paymentStatus}`);
        }
    }
    console.log('Bons de commande / dettes fournisseurs seedés');
}
//# sourceMappingURL=purchase-order.seeder.js.map