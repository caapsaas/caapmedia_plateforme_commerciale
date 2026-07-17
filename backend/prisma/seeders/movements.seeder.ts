import { PrismaClient, Prisma, OrderStatus, ProductionStatus, PaymentStatus, OrderSource, ContactStatus } from '@prisma/client';

// Seeder idempotent (rejouable sans dupliquer) qui peuple des "mouvements"
// commerciaux (commandes) realistes et volontairement DIFFERENTS par
// filiale, pour pouvoir observer concretement l'architecture multi-filiale:
// - le SUPER_ADMIN (nalobert, siège) doit voir la somme consolidee des 4
//   filiales, avec possibilite de filtrer par filiale;
// - chaque ADMIN de filiale (y compris celui du siège) ne doit voir QUE les
//   chiffres de SA propre filiale.
// Douala reutilise le catalogue produits/contacts deja seede par
// product.seeder.ts/contact.seeder.ts (executes avant celui-ci, voir
// seeds.ts). Siège/Kribi/Edéa recoivent ici un petit catalogue et des
// contacts dedies, propres a chaque filiale.

interface ProductSeed {
    name: string;
    mainCategory: string;
    category: string;
    description: string;
    price: number;
    sellingPrice: number;
    warehouse: string;
}

interface ContactSeed {
    contactName: string;
    company: string;
    email: string;
    phone: string;
    address: string;
    since: string;
}

interface OrderSeed {
    customerEmail: string;
    customerName: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    daysAgo: number; // Date relative a aujourd'hui, pour un historique credible
    status: OrderStatus;
    // Non-nullable dans le schema (Order.productionStatus: ProductionStatus).
    productionStatus: ProductionStatus;
    paymentStatus: PaymentStatus;
    amountPaidRatio: number; // 1 = paye integralement, 0 = rien encore paye
}

interface SubsidiarySeedConfig {
    subsidiaryEmail: string;
    salesRepEmail: string;
    products?: ProductSeed[];
    contacts?: ContactSeed[];
    orders: OrderSeed[];
}

const TAX_RATE_VALUE = 0.1925;

const CONFIGS: SubsidiarySeedConfig[] = [
    // --- Douala: reutilise le catalogue et les contacts existants ---
    {
        subsidiaryEmail: 'contact.douala@caap.cm',
        salesRepEmail: 'jean.commercial@caap.cm',
        orders: [
            { customerEmail: 'louis.nantcha@example.com', customerName: 'NANTCHA, Louis Bernard', productName: 'Cartes de visite', quantity: 2000, unitPrice: 50, daysAgo: 45, status: OrderStatus.COMPLETED, productionStatus: ProductionStatus.READY_FOR_DELIVERY, paymentStatus: PaymentStatus.PAID, amountPaidRatio: 1 },
            { customerEmail: 'paul.kamdem@example.com', customerName: 'KAMDEM, Paul', productName: 'Flyers & Dépliants', quantity: 5000, unitPrice: 30, daysAgo: 30, status: OrderStatus.DELIVERED, productionStatus: ProductionStatus.READY_FOR_DELIVERY, paymentStatus: PaymentStatus.PAID, amountPaidRatio: 1 },
            { customerEmail: 'hard.nata@example.com', customerName: 'NATA, hard (Caapfar)', productName: 'T-Shirt Imprimé', quantity: 40, unitPrice: 7500, daysAgo: 18, status: OrderStatus.IN_PRODUCTION, productionStatus: ProductionStatus.PRINTING, paymentStatus: PaymentStatus.PARTIALLY_PAID, amountPaidRatio: 0.5 },
            { customerEmail: 'louis.nantcha@example.com', customerName: 'NANTCHA, Louis Bernard', productName: 'Bâche publicitaire', quantity: 6, unitPrice: 12000, daysAgo: 7, status: OrderStatus.NEW, productionStatus: ProductionStatus.PREPRESS, paymentStatus: PaymentStatus.UNPAID, amountPaidRatio: 0 },
            // productionStatus est NON-NULLABLE dans le schema (Order.productionStatus:
            // ProductionStatus, pas ProductionStatus?) - une commande annulee avant
            // production garde PREPRESS (jamais avancee), pas null.
            { customerEmail: 'paul.kamdem@example.com', customerName: 'KAMDEM, Paul', productName: 'Mug Personnalisé', quantity: 100, unitPrice: 4500, daysAgo: 60, status: OrderStatus.CANCELLED, productionStatus: ProductionStatus.PREPRESS, paymentStatus: PaymentStatus.UNPAID, amountPaidRatio: 0 },
        ],
    },
    // --- Siège: prestations de services corporate (coordination, conseil) ---
    {
        subsidiaryEmail: 'contact.siege@caap.cm',
        salesRepEmail: 'admin.siege@caap.cm',
        products: [
            { name: 'Conseil Stratégie Communication', mainCategory: 'Prestations de services', category: 'Conseil', description: 'Accompagnement strategique en communication pour filiale ou groupe.', price: 200000, sellingPrice: 350000, warehouse: 'Siège' },
            { name: 'Audit Identité de Marque', mainCategory: 'Prestations de services', category: 'Conseil', description: 'Audit complet de la charte graphique et de la coherence de marque.', price: 150000, sellingPrice: 280000, warehouse: 'Siège' },
            { name: 'Coordination Inter-Filiales', mainCategory: 'Prestations de services', category: 'Conseil', description: 'Prestation de coordination et de reporting consolide entre filiales.', price: 250000, sellingPrice: 450000, warehouse: 'Siège' },
        ],
        contacts: [
            { contactName: 'Groupe SABC', company: 'Societe Anonyme des Brasseries du Cameroun', email: 'contact@sabc-groupe.example.com', phone: '233420001', address: 'Akwa, Douala', since: '2022-01-10' },
            { contactName: 'MTN Cameroun - Siège', company: 'MTN Cameroun', email: 'partenariats@mtn-siege.example.com', phone: '233420002', address: 'Bonanjo, Douala', since: '2023-03-05' },
        ],
        orders: [
            { customerEmail: 'contact@sabc-groupe.example.com', customerName: 'Groupe SABC', productName: 'Coordination Inter-Filiales', quantity: 1, unitPrice: 450000, daysAgo: 20, status: OrderStatus.COMPLETED, productionStatus: ProductionStatus.READY_FOR_DELIVERY, paymentStatus: PaymentStatus.PAID, amountPaidRatio: 1 },
            { customerEmail: 'partenariats@mtn-siege.example.com', customerName: 'MTN Cameroun - Siège', productName: 'Audit Identité de Marque', quantity: 1, unitPrice: 280000, daysAgo: 12, status: OrderStatus.DELIVERED, productionStatus: ProductionStatus.READY_FOR_DELIVERY, paymentStatus: PaymentStatus.PAID, amountPaidRatio: 1 },
            { customerEmail: 'contact@sabc-groupe.example.com', customerName: 'Groupe SABC', productName: 'Conseil Stratégie Communication', quantity: 1, unitPrice: 350000, daysAgo: 3, status: OrderStatus.NEW, productionStatus: ProductionStatus.PREPRESS, paymentStatus: PaymentStatus.UNPAID, amountPaidRatio: 0 },
        ],
    },
    // --- Kribi: imprimerie regionale, port/industrie ---
    {
        subsidiaryEmail: 'contact.kribi@caap.cm',
        salesRepEmail: 'commercial.kribi@caap.cm',
        products: [
            { name: 'Étiquettes Adhésives Export', mainCategory: 'Imprimerie', category: 'Étiquetage', description: 'Etiquettes adhesives resistantes pour conteneurs et colis export.', price: 15, sellingPrice: 35, warehouse: 'Kribi Centre' },
            { name: 'Flyers Événementiel Kribi', mainCategory: 'Imprimerie', category: 'Pub', description: 'Flyers pour evenements locaux et promotions balneaires.', price: 15, sellingPrice: 30, warehouse: 'Kribi Centre' },
            { name: 'Bâche Publicitaire Kribi', mainCategory: 'Signalétique & Display', category: 'Bâches & Banderoles', description: 'Bache PVC grand format, resistante a l\'air marin.', price: 5500, sellingPrice: 13000, warehouse: 'Kribi Centre' },
        ],
        contacts: [
            { contactName: 'KPC Port de Kribi', company: 'Kribi Port Complex', email: 'logistique@kpc-kribi.example.com', phone: '233460010', address: 'Zone Portuaire, Kribi', since: '2023-06-01' },
            { contactName: 'Hôtel Ilomba', company: 'Ilomba Resort', email: 'contact@ilomba-resort.example.com', phone: '233460011', address: 'Plage de Kribi', since: '2023-09-15' },
        ],
        orders: [
            { customerEmail: 'logistique@kpc-kribi.example.com', customerName: 'KPC Port de Kribi', productName: 'Étiquettes Adhésives Export', quantity: 4000, unitPrice: 35, daysAgo: 25, status: OrderStatus.COMPLETED, productionStatus: ProductionStatus.READY_FOR_DELIVERY, paymentStatus: PaymentStatus.PAID, amountPaidRatio: 1 },
            { customerEmail: 'contact@ilomba-resort.example.com', customerName: 'Hôtel Ilomba', productName: 'Flyers Événementiel Kribi', quantity: 2000, unitPrice: 30, daysAgo: 14, status: OrderStatus.DELIVERED, productionStatus: ProductionStatus.READY_FOR_DELIVERY, paymentStatus: PaymentStatus.PAID, amountPaidRatio: 1 },
            { customerEmail: 'contact@ilomba-resort.example.com', customerName: 'Hôtel Ilomba', productName: 'Bâche Publicitaire Kribi', quantity: 3, unitPrice: 13000, daysAgo: 5, status: OrderStatus.IN_PRODUCTION, productionStatus: ProductionStatus.FINISHING, paymentStatus: PaymentStatus.PARTIALLY_PAID, amountPaidRatio: 0.4 },
        ],
    },
    // --- Edéa: imprimerie regionale, zone industrielle (ALUCAM) ---
    {
        subsidiaryEmail: 'contact.edea@caap.cm',
        salesRepEmail: 'commercial.edea@caap.cm',
        products: [
            { name: 'Panneaux Signalisation Industrielle', mainCategory: 'Signalétique & Display', category: 'Panneaux & Enseignes', description: 'Panneaux de securite et signalisation pour sites industriels.', price: 9000, sellingPrice: 20000, warehouse: 'Edéa Centre' },
            { name: 'Cartes de Visite Edéa', mainCategory: 'Imprimerie', category: 'Carterie', description: 'Cartes de visite professionnelles, impression standard.', price: 20, sellingPrice: 50, warehouse: 'Edéa Centre' },
            { name: 'Affiches A3 Edéa', mainCategory: 'Imprimerie', category: 'Pub', description: 'Affiches format A3 pour communication interne et externe.', price: 400, sellingPrice: 1000, warehouse: 'Edéa Centre' },
        ],
        contacts: [
            { contactName: 'ALUCAM', company: 'Aluminium du Cameroun', email: 'achats@alucam-edea.example.com', phone: '233450020', address: 'Zone Industrielle, Edéa', since: '2022-11-20' },
            { contactName: 'Mairie d\'Edéa', company: 'Commune d\'Edéa', email: 'communication@mairie-edea.example.com', phone: '233450021', address: 'Centre-ville, Edéa', since: '2023-02-08' },
        ],
        orders: [
            { customerEmail: 'achats@alucam-edea.example.com', customerName: 'ALUCAM', productName: 'Panneaux Signalisation Industrielle', quantity: 15, unitPrice: 20000, daysAgo: 33, status: OrderStatus.COMPLETED, productionStatus: ProductionStatus.READY_FOR_DELIVERY, paymentStatus: PaymentStatus.PAID, amountPaidRatio: 1 },
            { customerEmail: 'communication@mairie-edea.example.com', customerName: "Mairie d'Edéa", productName: 'Affiches A3 Edéa', quantity: 1500, unitPrice: 1000, daysAgo: 16, status: OrderStatus.DELIVERED, productionStatus: ProductionStatus.READY_FOR_DELIVERY, paymentStatus: PaymentStatus.PAID, amountPaidRatio: 1 },
            { customerEmail: 'achats@alucam-edea.example.com', customerName: 'ALUCAM', productName: 'Cartes de Visite Edéa', quantity: 3000, unitPrice: 50, daysAgo: 4, status: OrderStatus.NEW, productionStatus: ProductionStatus.PREPRESS, paymentStatus: PaymentStatus.UNPAID, amountPaidRatio: 0 },
        ],
    },
];

export async function runMovementsSeeder(prisma: PrismaClient) {
    const taxRate = await prisma.taxRate.findFirst({ where: { taxRatesName: 'TVA' } });
    if (!taxRate) {
        console.warn('Taux de taxe TVA introuvable, mouvements ignorés (lancer runTaxRateSeeder avant).');
        return;
    }

    for (const config of CONFIGS) {
        const subsidiary = await prisma.subsidiary.findUnique({ where: { email: config.subsidiaryEmail } });
        if (!subsidiary) {
            console.warn(`Filiale introuvable pour ${config.subsidiaryEmail}, mouvements ignorés`);
            continue;
        }

        const salesRep = await prisma.user.findUnique({ where: { email: config.salesRepEmail } });
        if (!salesRep) {
            console.warn(`Commercial introuvable pour ${config.salesRepEmail}, mouvements ignorés pour ${config.subsidiaryEmail}`);
            continue;
        }

        // Produits dedies a la filiale (Douala reutilise son catalogue existant, rien a creer ici)
        for (const p of config.products ?? []) {
            const existing = await prisma.product.findFirst({
                where: { productName: p.name, subsidiaryId: subsidiary.id },
            });
            if (existing) continue;
            await prisma.product.create({
                data: {
                    productName: p.name,
                    mainCategory: p.mainCategory,
                    category: p.category,
                    description: p.description,
                    stock: new Prisma.Decimal(1000),
                    price: new Prisma.Decimal(p.price),
                    sellingPrice: new Prisma.Decimal(p.sellingPrice),
                    warehouse: p.warehouse,
                    productRange: 'Standard',
                    subsidiary: { connect: { id: subsidiary.id } },
                },
            });
        }

        // Contacts dedies a la filiale (Douala reutilise ses contacts existants)
        for (const contactSeed of config.contacts ?? []) {
            await prisma.contact.upsert({
                where: { email: contactSeed.email },
                update: {},
                create: {
                    contactName: contactSeed.contactName,
                    company: contactSeed.company,
                    email: contactSeed.email,
                    phone: contactSeed.phone,
                    address: contactSeed.address,
                    since: new Date(contactSeed.since),
                    isVerified: true,
                    status: ContactStatus.ACTIVE,
                    subsidiary: { connect: { id: subsidiary.id } },
                    salesRep: { connect: { id: salesRep.id } },
                },
            });
        }

        // Commandes: idempotent par (client + filiale + date), pour ne pas
        // dupliquer a chaque `npm run seed`.
        for (const o of config.orders) {
            const contact = await prisma.contact.findUnique({ where: { email: o.customerEmail } });
            if (!contact) {
                console.warn(`Contact introuvable pour ${o.customerEmail}, commande ignorée`);
                continue;
            }
            const product = await prisma.product.findFirst({
                where: { productName: o.productName, subsidiaryId: subsidiary.id },
            });
            if (!product) {
                console.warn(`Produit "${o.productName}" introuvable pour ${config.subsidiaryEmail}, commande ignorée`);
                continue;
            }

            const orderDate = new Date();
            orderDate.setDate(orderDate.getDate() - o.daysAgo);
            const paymentDueDate = new Date(orderDate);
            paymentDueDate.setDate(paymentDueDate.getDate() + 30);

            const existingOrder = await prisma.order.findFirst({
                where: {
                    customerId: contact.id,
                    subsidiaryId: subsidiary.id,
                    orderDate: {
                        gte: new Date(orderDate.toDateString()),
                        lt: new Date(new Date(orderDate.toDateString()).getTime() + 24 * 60 * 60 * 1000),
                    },
                },
            });
            if (existingOrder) continue;

            const subtotal = o.quantity * o.unitPrice;
            const taxAmount = Math.round(subtotal * TAX_RATE_VALUE);
            const totalAmount = subtotal + taxAmount;
            const amountPaid = Math.round(totalAmount * o.amountPaidRatio);

            const orderData: any = {
                customerId: contact.id,
                customerName: o.customerName,
                orderDate,
                subtotal,
                taxAmount,
                totalAmount,
                taxRateValue: TAX_RATE_VALUE,
                status: o.status,
                productionStatus: o.productionStatus,
                paymentStatus: o.paymentStatus,
                amountPaid,
                paymentDueDate,
                source: OrderSource.MANUAL,
                subsidiaryId: subsidiary.id,
                salesRepId: salesRep.id,
                taxRateId: taxRate.id,
                orderItems: {
                    create: [{ quantity: o.quantity, unitPrice: o.unitPrice, productId: product.id }],
                },
            };
            if (o.productionStatus) {
                orderData.productionHistory = { create: [{ status: o.productionStatus }] };
            }

            const order = await prisma.order.create({ data: orderData });
            console.log(`Order ${order.id} créé pour ${o.customerName} (${config.subsidiaryEmail})`);
        }
    }

    console.log('Movements (commandes multi-filiales) seeded');
}
