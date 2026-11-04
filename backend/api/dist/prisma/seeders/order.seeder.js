"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runOrdersSeeder = runOrdersSeeder;
const client_1 = require("@prisma/client");
const client_2 = require("@prisma/client");
const generate_id_util_1 = require("./generate-id.util");
const id_prefixes_const_1 = require("./id-prefixes.const");
async function buildSpecSnapshot(prisma, productId) {
    const [groups, specifications] = await Promise.all([
        prisma.productSpecGroup.findMany({
            where: { productId },
            orderBy: { order: 'asc' },
        }),
        prisma.productSpecification.findMany({
            where: { productId },
            orderBy: { order: 'asc' },
        }),
    ]);
    const refKeys = specifications
        .map(s => {
        const pv = s.possibleValues;
        return pv && 'referenceListKey' in pv ? String(pv.referenceListKey) : null;
    })
        .filter((k) => !!k);
    const refLists = refKeys.length
        ? await prisma.specReferenceList.findMany({
            where: { key: { in: refKeys } },
            include: { values: { orderBy: { order: 'asc' } } },
        })
        : [];
    const refByKey = new Map(refLists.map(l => [l.key, l]));
    const resolveOptions = (raw) => {
        if (!raw)
            return null;
        const obj = raw;
        if ('referenceListKey' in obj) {
            const list = refByKey.get(String(obj.referenceListKey));
            return list?.values.map(v => ({ value: v.value, label: v.label })) ?? null;
        }
        if (Array.isArray(raw))
            return raw;
        return null;
    };
    const specsByGroup = new Map();
    const ungrouped = [];
    for (const s of specifications) {
        if (s.groupId) {
            const arr = specsByGroup.get(s.groupId) ?? [];
            arr.push(s);
            specsByGroup.set(s.groupId, arr);
        }
        else {
            ungrouped.push(s);
        }
    }
    const toFormSpec = (s) => ({
        id: s.id,
        groupId: s.groupId,
        name: s.name,
        technicalKey: s.technicalKey,
        type: s.type,
        required: s.required,
        defaultValue: s.defaultValue,
        possibleValues: resolveOptions(s.possibleValues),
        order: s.order,
        helpText: s.helpText,
        placeholder: s.placeholder,
        unit: s.unit,
        visibleToClient: s.visibleToClient,
        visibleToProduction: s.visibleToProduction,
        editableAfterValidation: s.editableAfterValidation,
        searchable: s.searchable,
        typeConfig: s.typeConfig,
        rules: s.rules,
    });
    return {
        productId,
        groups: groups.map(g => ({
            id: g.id,
            name: g.name,
            order: g.order,
            specifications: (specsByGroup.get(g.id) ?? []).map(toFormSpec),
        })),
        ungroupedSpecifications: ungrouped.map(toFormSpec),
    };
}
async function seedValidationDemoOrders(prisma) {
    const taxRate = await prisma.taxRate.findFirst({ where: { taxRatesName: 'TVA' } });
    if (!taxRate)
        throw new Error('TaxRate TVA introuvable');
    const doubalaSubsidiary = await prisma.subsidiary.findUnique({ where: { email: 'contact.douala@caap.cm' } });
    if (!doubalaSubsidiary)
        throw new Error('Filiale Douala introuvable');
    const salesRep = await prisma.user.findUnique({ where: { email: 'jean.commercial@caap.cm' } });
    if (!salesRep)
        throw new Error('Commercial Douala introuvable');
    const flyers = await prisma.item.findFirst({ where: { name: 'Flyers & Dépliants', type: client_2.ItemType.SERVICE } });
    const cartes = await prisma.item.findFirst({ where: { name: 'Cartes de visite', type: client_2.ItemType.SERVICE } });
    if (!flyers || !cartes) {
        console.warn('Produits "Flyers & Dépliants" ou "Cartes de visite" introuvables, skip commandes démo validation');
        return;
    }
    const equipments = await prisma.equipment.findMany({
        where: { subsidiaryId: doubalaSubsidiary.id },
        include: { costConfig: true },
    });
    const equip = (name) => equipments.find(e => e.equipmentName.includes(name));
    const heidelberg = equip('Heldelberg');
    const gto = equip('GTO');
    const insoleuse = equip('Insoleuse');
    const mastico = equip('Mastico');
    const rolande = equip('Rolande');
    if (!heidelberg?.costConfig || !gto?.costConfig || !insoleuse?.costConfig) {
        console.warn('Équipements ou configs de coût manquants pour le seed de validation, skip');
        return;
    }
    const contactKamdem = await prisma.contact.findUnique({ where: { email: 'paul.kamdem@example.com' } });
    const contactMbarga = await prisma.contact.findUnique({ where: { email: 'jp.mbarga@mbarga-trading.com' } });
    const flyersSnapshot = await buildSpecSnapshot(prisma, flyers.id);
    const cartesSnapshot = await buildSpecSnapshot(prisma, cartes.id);
    if (contactKamdem) {
        const existing = await prisma.order.findFirst({
            where: {
                customerId: contactKamdem.id,
                subsidiaryId: doubalaSubsidiary.id,
                status: client_2.OrderStatus.PENDING_VALIDATION,
                totalAmount: { gte: 71500, lte: 71600 },
            },
        });
        if (!existing) {
            const qty1 = 500;
            const price1 = 120;
            const subtotal1 = new client_1.Prisma.Decimal(qty1 * price1);
            const taxAmount1 = subtotal1.mul(taxRate.rate);
            const totalAmount1 = subtotal1.add(taxAmount1);
            const steps1 = [
                { eq: insoleuse, hours: 1.5 },
                { eq: heidelberg, hours: 2.0 },
                ...(mastico?.costConfig ? [{ eq: mastico, hours: 0.5 }] : []),
            ];
            const totalProdCost1 = steps1.reduce((acc, s) => acc + s.hours * Number(s.eq.costConfig.hourlyRate), 0);
            const sellingPrice1 = qty1 * price1;
            const marginPct1 = ((sellingPrice1 - totalProdCost1) / sellingPrice1) * 100;
            const order1 = await prisma.order.create({
                data: {
                    id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ORDER),
                    customerName: contactKamdem.contactName,
                    customerId: contactKamdem.id,
                    subsidiaryId: doubalaSubsidiary.id,
                    salesRepId: salesRep.id,
                    taxRateId: taxRate.id,
                    taxRateValue: taxRate.rate,
                    subtotal: subtotal1,
                    taxAmount: taxAmount1,
                    totalAmount: totalAmount1,
                    amountPaid: 0,
                    paymentDueDate: new Date('2026-08-25'),
                    status: client_2.OrderStatus.PENDING_VALIDATION,
                    productionStatus: client_2.ProductionStatus.PREPRESS,
                    paymentStatus: client_2.PaymentStatus.UNPAID,
                    source: client_2.OrderSource.MANUAL,
                    productionHistory: { create: { id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ORDERPRODUCTIONHISTORY), status: client_2.ProductionStatus.PREPRESS } },
                    orderItems: {
                        create: [
                            {
                                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ORDERITEM),
                                quantity: qty1,
                                unitPrice: price1,
                                discount: 0,
                                total: subtotal1,
                                productId: flyers.id,
                                specValues: {
                                    format: 'A5',
                                    paper_type: 'couche_brillant',
                                    grammage: '135',
                                    print_side: 'recto_verso',
                                    lamination: 'pelliculage_brillant',
                                    delivery_notes: 'Livraison urgente avant le 30/08 pour campagne MTN',
                                },
                                specSnapshot: flyersSnapshot,
                                productOptions: {
                                    create: [
                                        { id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.PRODUCTOPTION), optionType: 'Format', optionValue: 'A5' },
                                        { id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.PRODUCTOPTION), optionType: 'Finition', optionValue: 'Pelliculage brillant' },
                                    ],
                                },
                            },
                        ],
                    },
                },
                include: { orderItems: true },
            });
            const item1 = order1.orderItems[0];
            await prisma.orderItemProductionStep.createMany({
                data: steps1.map((s, i) => ({
                    id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ORDERITEMPRODUCTIONSTEP),
                    orderItemId: item1.id,
                    equipmentId: s.eq.id,
                    equipmentNameSnapshot: s.eq.equipmentName,
                    stepOrder: i + 1,
                    estimatedTimeHours: new client_1.Prisma.Decimal(s.hours),
                    hourlyRateSnapshot: new client_1.Prisma.Decimal(Number(s.eq.costConfig.hourlyRate)),
                    calculatedCost: new client_1.Prisma.Decimal(s.hours * Number(s.eq.costConfig.hourlyRate)),
                })),
            });
            await prisma.orderItemProductionSummary.create({
                data: {
                    id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ORDERITEMPRODUCTIONSUMMARY),
                    orderItemId: item1.id,
                    totalProductionCost: new client_1.Prisma.Decimal(totalProdCost1),
                    marginPercent: new client_1.Prisma.Decimal(marginPct1),
                    finalPrice: new client_1.Prisma.Decimal(sellingPrice1),
                },
            });
            console.log(`[validation-demo] Commande Flyers créée pour ${contactKamdem.contactName} — total ${totalAmount1.toFixed(0)} FCFA`);
        }
        else {
            console.log(`[validation-demo] Commande Flyers pour ${contactKamdem.contactName} déjà existante, skip`);
        }
    }
    if (contactMbarga) {
        const existing = await prisma.order.findFirst({
            where: {
                customerId: contactMbarga.id,
                subsidiaryId: doubalaSubsidiary.id,
                status: client_2.OrderStatus.PENDING_VALIDATION,
                totalAmount: { gte: 83400, lte: 83500 },
            },
        });
        if (!existing) {
            const qty2 = 200;
            const price2 = 350;
            const subtotal2 = new client_1.Prisma.Decimal(qty2 * price2);
            const taxAmount2 = subtotal2.mul(taxRate.rate);
            const totalAmount2 = subtotal2.add(taxAmount2);
            const steps2 = [
                { eq: gto, hours: 1.0 },
                ...(rolande?.costConfig ? [{ eq: rolande, hours: 0.5 }] : []),
            ];
            const totalProdCost2 = steps2.reduce((acc, s) => acc + s.hours * Number(s.eq.costConfig.hourlyRate), 0);
            const sellingPrice2 = qty2 * price2;
            const marginPct2 = ((sellingPrice2 - totalProdCost2) / sellingPrice2) * 100;
            const order2 = await prisma.order.create({
                data: {
                    id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ORDER),
                    customerName: contactMbarga.contactName,
                    customerId: contactMbarga.id,
                    subsidiaryId: doubalaSubsidiary.id,
                    salesRepId: salesRep.id,
                    taxRateId: taxRate.id,
                    taxRateValue: taxRate.rate,
                    subtotal: subtotal2,
                    taxAmount: taxAmount2,
                    totalAmount: totalAmount2,
                    amountPaid: new client_1.Prisma.Decimal(40000),
                    paymentDueDate: new Date('2026-08-10'),
                    status: client_2.OrderStatus.PENDING_VALIDATION,
                    productionStatus: client_2.ProductionStatus.PREPRESS,
                    paymentStatus: client_2.PaymentStatus.PARTIALLY_PAID,
                    source: client_2.OrderSource.MANUAL,
                    productionHistory: { create: { id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ORDERPRODUCTIONHISTORY), status: client_2.ProductionStatus.PREPRESS } },
                    orderItems: {
                        create: [
                            {
                                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ORDERITEM),
                                quantity: qty2,
                                unitPrice: price2,
                                discount: 0,
                                total: subtotal2,
                                productId: cartes.id,
                                specValues: {
                                    grammage: '350',
                                    finish: 'mat',
                                    print_side: 'recto_verso',
                                    quantity_boxes: '200',
                                },
                                specSnapshot: cartesSnapshot,
                                productOptions: {
                                    create: [
                                        { id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.PRODUCTOPTION), optionType: 'Finition', optionValue: 'Pelliculage mat' },
                                        { id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.PRODUCTOPTION), optionType: 'Impression', optionValue: 'Recto/Verso' },
                                    ],
                                },
                            },
                        ],
                    },
                },
                include: { orderItems: true },
            });
            const item2 = order2.orderItems[0];
            await prisma.orderItemProductionStep.createMany({
                data: steps2.map((s, i) => ({
                    id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ORDERITEMPRODUCTIONSTEP),
                    orderItemId: item2.id,
                    equipmentId: s.eq.id,
                    equipmentNameSnapshot: s.eq.equipmentName,
                    stepOrder: i + 1,
                    estimatedTimeHours: new client_1.Prisma.Decimal(s.hours),
                    hourlyRateSnapshot: new client_1.Prisma.Decimal(Number(s.eq.costConfig.hourlyRate)),
                    calculatedCost: new client_1.Prisma.Decimal(s.hours * Number(s.eq.costConfig.hourlyRate)),
                })),
            });
            await prisma.orderItemProductionSummary.create({
                data: {
                    id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ORDERITEMPRODUCTIONSUMMARY),
                    orderItemId: item2.id,
                    totalProductionCost: new client_1.Prisma.Decimal(totalProdCost2),
                    marginPercent: new client_1.Prisma.Decimal(marginPct2),
                    finalPrice: new client_1.Prisma.Decimal(sellingPrice2),
                },
            });
            console.log(`[validation-demo] Commande Cartes créée pour ${contactMbarga.contactName} — total ${totalAmount2.toFixed(0)} FCFA`);
        }
        else {
            console.log(`[validation-demo] Commande Cartes pour ${contactMbarga.contactName} déjà existante, skip`);
        }
    }
}
async function runOrdersSeeder(prisma) {
    const taxRate = await prisma.taxRate.findFirst();
    if (!taxRate)
        throw new Error('Aucun taux de taxe trouvé pour créer une Order');
    const product = await prisma.item.findFirst({ where: { type: client_2.ItemType.SERVICE } });
    if (!product)
        throw new Error('Aucun service trouvé pour créer un OrderItem');
    const simpleOrders = [
        {
            customerEmail: 'hard.nata@example.com',
            customerName: 'NATA, hard (Caapfar)',
            subsidiaryEmail: 'contact.douala@caap.cm',
            salesRepEmail: 'jean.commercial@caap.cm',
            subtotal: 18750,
            taxAmount: 3375,
            totalAmount: 22125,
            taxRateValue: 0.1925,
            status: client_2.OrderStatus.COMPLETED,
            productionStatus: client_2.ProductionStatus.READY_FOR_DELIVERY,
            paymentStatus: client_2.PaymentStatus.PAID,
            amountPaid: 22125,
            paymentDueDate: new Date('2024-07-20'),
            source: client_2.OrderSource.MANUAL,
            unitPrice: 75,
            quantity: 250,
        },
    ];
    for (const o of simpleOrders) {
        const contact = await prisma.contact.findUnique({ where: { email: o.customerEmail } });
        if (!contact) {
            console.warn(`Contact non trouvé: ${o.customerEmail}`);
            continue;
        }
        const subsidiary = await prisma.subsidiary.findUnique({ where: { email: o.subsidiaryEmail } });
        if (!subsidiary) {
            console.warn(`Filiale non trouvée: ${o.subsidiaryEmail}`);
            continue;
        }
        const salesRep = await prisma.user.findUnique({ where: { email: o.salesRepEmail } });
        if (!salesRep) {
            console.warn(`Commercial non trouvé: ${o.salesRepEmail}`);
            continue;
        }
        const existing = await prisma.order.findFirst({
            where: { customerId: contact.id, subsidiaryId: subsidiary.id, totalAmount: o.totalAmount },
        });
        if (existing) {
            console.log(`Order déjà existante pour ${contact.email} (${o.totalAmount}), skip`);
            continue;
        }
        const order = await prisma.order.create({
            data: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ORDER),
                customerId: contact.id,
                customerName: o.customerName,
                subtotal: new client_1.Prisma.Decimal(o.subtotal),
                taxAmount: new client_1.Prisma.Decimal(o.taxAmount),
                totalAmount: new client_1.Prisma.Decimal(o.totalAmount),
                taxRateValue: new client_1.Prisma.Decimal(o.taxRateValue),
                status: o.status,
                productionStatus: o.productionStatus,
                paymentStatus: o.paymentStatus,
                amountPaid: new client_1.Prisma.Decimal(o.amountPaid),
                paymentDueDate: o.paymentDueDate,
                source: o.source,
                subsidiaryId: subsidiary.id,
                salesRepId: salesRep.id,
                taxRateId: taxRate.id,
                productionHistory: { create: [{ id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ORDERPRODUCTIONHISTORY), status: o.productionStatus }] },
                orderItems: {
                    create: [{
                            id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ORDERITEM),
                            quantity: o.quantity,
                            unitPrice: new client_1.Prisma.Decimal(o.unitPrice),
                            discount: 0,
                            total: new client_1.Prisma.Decimal(o.quantity * o.unitPrice),
                            productId: product.id,
                        }],
                },
            },
        });
        console.log(`Order ${order.id} créé pour ${contact.email}`);
    }
    await seedValidationDemoOrders(prisma);
}
//# sourceMappingURL=order.seeder.js.map