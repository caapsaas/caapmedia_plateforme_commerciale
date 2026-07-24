import { PrismaClient, Prisma } from '@prisma/client';
import { OrderStatus, ProductionStatus, PaymentStatus, OrderSource, ItemType } from '@prisma/client';

// ─── Helper : construit le specSnapshot (FormDefinition) depuis la DB ──────

async function buildSpecSnapshot(prisma: PrismaClient, productId: string) {
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

    // Résoudre les référentiels partagés (paper_type, grammage, etc.)
    const refKeys = specifications
        .map(s => {
            const pv = s.possibleValues as Record<string, unknown> | null;
            return pv && 'referenceListKey' in pv ? String(pv.referenceListKey) : null;
        })
        .filter((k): k is string => !!k);

    const refLists = refKeys.length
        ? await prisma.specReferenceList.findMany({
              where: { key: { in: refKeys } },
              include: { values: { orderBy: { order: 'asc' } } },
          })
        : [];
    const refByKey = new Map(refLists.map(l => [l.key, l]));

    const resolveOptions = (raw: unknown): { value: string; label: string }[] | null => {
        if (!raw) return null;
        const obj = raw as Record<string, unknown>;
        if ('referenceListKey' in obj) {
            const list = refByKey.get(String(obj.referenceListKey));
            return list?.values.map(v => ({ value: v.value, label: v.label })) ?? null;
        }
        if (Array.isArray(raw)) return raw as { value: string; label: string }[];
        return null;
    };

    const specsByGroup = new Map<string, typeof specifications>();
    const ungrouped: typeof specifications = [];
    for (const s of specifications) {
        if (s.groupId) {
            const arr = specsByGroup.get(s.groupId) ?? [];
            arr.push(s);
            specsByGroup.set(s.groupId, arr);
        } else {
            ungrouped.push(s);
        }
    }

    const toFormSpec = (s: (typeof specifications)[number]) => ({
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

// ─── Commandes de validation démo (avec specs + étapes de production) ──────

async function seedValidationDemoOrders(prisma: PrismaClient) {
    const taxRate = await prisma.taxRate.findFirst({ where: { taxRatesName: 'TVA' } });
    if (!taxRate) throw new Error('TaxRate TVA introuvable');

    const doubalaSubsidiary = await prisma.subsidiary.findUnique({ where: { email: 'contact.douala@caap.cm' } });
    if (!doubalaSubsidiary) throw new Error('Filiale Douala introuvable');

    const salesRep = await prisma.user.findUnique({ where: { email: 'jean.commercial@caap.cm' } });
    if (!salesRep) throw new Error('Commercial Douala introuvable');

    // ── Produits avec specs ──────────────────────────────────────────────────
    const flyers = await prisma.item.findFirst({ where: { name: 'Flyers & Dépliants', type: ItemType.SERVICE } });
    const cartes = await prisma.item.findFirst({ where: { name: 'Cartes de visite', type: ItemType.SERVICE } });
    if (!flyers || !cartes) {
        console.warn('Produits "Flyers & Dépliants" ou "Cartes de visite" introuvables, skip commandes démo validation');
        return;
    }

    // ── Équipements Douala avec coût horaire ─────────────────────────────────
    const equipments = await prisma.equipment.findMany({
        where: { subsidiaryId: doubalaSubsidiary.id },
        include: { costConfig: true },
    });
    const equip = (name: string) => equipments.find(e => e.equipmentName.includes(name));
    const heidelberg = equip('Heldelberg');
    const gto = equip('GTO');
    const insoleuse = equip('Insoleuse');
    const mastico = equip('Mastico');
    const rolande = equip('Rolande');

    if (!heidelberg?.costConfig || !gto?.costConfig || !insoleuse?.costConfig) {
        console.warn('Équipements ou configs de coût manquants pour le seed de validation, skip');
        return;
    }

    // ── Contacts ─────────────────────────────────────────────────────────────
    const contactKamdem = await prisma.contact.findUnique({ where: { email: 'paul.kamdem@example.com' } });
    const contactMbarga = await prisma.contact.findUnique({ where: { email: 'jp.mbarga@mbarga-trading.com' } });

    // ── SpecSnapshot : Flyers & Dépliants ────────────────────────────────────
    const flyersSnapshot = await buildSpecSnapshot(prisma, flyers.id);

    // ── SpecSnapshot : Cartes de visite ──────────────────────────────────────
    const cartesSnapshot = await buildSpecSnapshot(prisma, cartes.id);

    // ── Commande 1 : KAMDEM — Flyers A5 biface couché brillant ───────────────
    // 500 flyers × 120 FCFA = 60 000 FCFA HT → TTC = 60 000 × 1.1925 = 71 550
    if (contactKamdem) {
        const existing = await prisma.order.findFirst({
            where: {
                customerId: contactKamdem.id,
                subsidiaryId: doubalaSubsidiary.id,
                status: OrderStatus.PENDING_VALIDATION,
                totalAmount: { gte: 71500, lte: 71600 },
            },
        });
        if (!existing) {
            const qty1 = 500;
            const price1 = 120;
            const subtotal1 = new Prisma.Decimal(qty1 * price1);
            const taxAmount1 = subtotal1.mul(taxRate.rate);
            const totalAmount1 = subtotal1.add(taxAmount1);

            // Étapes de production Flyers :
            // 1. Insoleuse 1.5h (insolation plaques) — 1500 × 1.5 = 2250
            // 2. MO-Heidelberg 2h (impression 4/4) — 5000 × 2 = 10 000
            // 3. Mastico 0.5h (massicotage) — 1200 × 0.5 = 600
            const steps1 = [
                { eq: insoleuse, hours: 1.5 },
                { eq: heidelberg, hours: 2.0 },
                ...(mastico?.costConfig ? [{ eq: mastico, hours: 0.5 }] : []),
            ];
            const totalProdCost1 = steps1.reduce((acc, s) => acc + s.hours * Number(s.eq!.costConfig!.hourlyRate), 0);
            const sellingPrice1 = qty1 * price1;
            const marginPct1 = ((sellingPrice1 - totalProdCost1) / sellingPrice1) * 100;

            const order1 = await prisma.order.create({
                data: {
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
                    status: OrderStatus.PENDING_VALIDATION,
                    productionStatus: ProductionStatus.PREPRESS,
                    paymentStatus: PaymentStatus.UNPAID,
                    source: OrderSource.MANUAL,
                    productionHistory: { create: { status: ProductionStatus.PREPRESS } },
                    orderItems: {
                        create: [
                            {
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
                                        { optionType: 'Format', optionValue: 'A5' },
                                        { optionType: 'Finition', optionValue: 'Pelliculage brillant' },
                                    ],
                                },
                            },
                        ],
                    },
                },
                include: { orderItems: true },
            });

            // ProductionSteps et Summary
            const item1 = order1.orderItems[0];
            await prisma.orderItemProductionStep.createMany({
                data: steps1.map((s, i) => ({
                    orderItemId: item1.id,
                    equipmentId: s.eq!.id,
                    equipmentNameSnapshot: s.eq!.equipmentName,
                    stepOrder: i + 1,
                    estimatedTimeHours: new Prisma.Decimal(s.hours),
                    hourlyRateSnapshot: new Prisma.Decimal(Number(s.eq!.costConfig!.hourlyRate)),
                    calculatedCost: new Prisma.Decimal(s.hours * Number(s.eq!.costConfig!.hourlyRate)),
                })),
            });
            await prisma.orderItemProductionSummary.create({
                data: {
                    orderItemId: item1.id,
                    totalProductionCost: new Prisma.Decimal(totalProdCost1),
                    marginPercent: new Prisma.Decimal(marginPct1),
                    finalPrice: new Prisma.Decimal(sellingPrice1),
                },
            });

            console.log(`[validation-demo] Commande Flyers créée pour ${contactKamdem.contactName} — total ${totalAmount1.toFixed(0)} FCFA`);
        } else {
            console.log(`[validation-demo] Commande Flyers pour ${contactKamdem.contactName} déjà existante, skip`);
        }
    }

    // ── Commande 2 : MBARGA — Cartes de visite pelliculées ───────────────────
    // 200 boîtes × 350 FCFA = 70 000 HT → TTC = 70 000 × 1.1925 = 83 475
    if (contactMbarga) {
        const existing = await prisma.order.findFirst({
            where: {
                customerId: contactMbarga.id,
                subsidiaryId: doubalaSubsidiary.id,
                status: OrderStatus.PENDING_VALIDATION,
                totalAmount: { gte: 83400, lte: 83500 },
            },
        });
        if (!existing) {
            const qty2 = 200;
            const price2 = 350;
            const subtotal2 = new Prisma.Decimal(qty2 * price2);
            const taxAmount2 = subtotal2.mul(taxRate.rate);
            const totalAmount2 = subtotal2.add(taxAmount2);

            // Étapes : GTO Heidelberg 1h + Rolande (finition) 0.5h
            const steps2 = [
                { eq: gto, hours: 1.0 },
                ...(rolande?.costConfig ? [{ eq: rolande, hours: 0.5 }] : []),
            ];
            const totalProdCost2 = steps2.reduce((acc, s) => acc + s.hours * Number(s.eq!.costConfig!.hourlyRate), 0);
            const sellingPrice2 = qty2 * price2;
            const marginPct2 = ((sellingPrice2 - totalProdCost2) / sellingPrice2) * 100;

            const order2 = await prisma.order.create({
                data: {
                    customerName: contactMbarga.contactName,
                    customerId: contactMbarga.id,
                    subsidiaryId: doubalaSubsidiary.id,
                    salesRepId: salesRep.id,
                    taxRateId: taxRate.id,
                    taxRateValue: taxRate.rate,
                    subtotal: subtotal2,
                    taxAmount: taxAmount2,
                    totalAmount: totalAmount2,
                    amountPaid: new Prisma.Decimal(40000),
                    paymentDueDate: new Date('2026-08-10'),
                    status: OrderStatus.PENDING_VALIDATION,
                    productionStatus: ProductionStatus.PREPRESS,
                    paymentStatus: PaymentStatus.PARTIALLY_PAID,
                    source: OrderSource.MANUAL,
                    productionHistory: { create: { status: ProductionStatus.PREPRESS } },
                    orderItems: {
                        create: [
                            {
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
                                        { optionType: 'Finition', optionValue: 'Pelliculage mat' },
                                        { optionType: 'Impression', optionValue: 'Recto/Verso' },
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
                    orderItemId: item2.id,
                    equipmentId: s.eq!.id,
                    equipmentNameSnapshot: s.eq!.equipmentName,
                    stepOrder: i + 1,
                    estimatedTimeHours: new Prisma.Decimal(s.hours),
                    hourlyRateSnapshot: new Prisma.Decimal(Number(s.eq!.costConfig!.hourlyRate)),
                    calculatedCost: new Prisma.Decimal(s.hours * Number(s.eq!.costConfig!.hourlyRate)),
                })),
            });
            await prisma.orderItemProductionSummary.create({
                data: {
                    orderItemId: item2.id,
                    totalProductionCost: new Prisma.Decimal(totalProdCost2),
                    marginPercent: new Prisma.Decimal(marginPct2),
                    finalPrice: new Prisma.Decimal(sellingPrice2),
                },
            });

            console.log(`[validation-demo] Commande Cartes créée pour ${contactMbarga.contactName} — total ${totalAmount2.toFixed(0)} FCFA`);
        } else {
            console.log(`[validation-demo] Commande Cartes pour ${contactMbarga.contactName} déjà existante, skip`);
        }
    }
}

// ─── Seeder principal ──────────────────────────────────────────────────────

export async function runOrdersSeeder(prisma: PrismaClient) {
    const taxRate = await prisma.taxRate.findFirst();
    if (!taxRate) throw new Error('Aucun taux de taxe trouvé pour créer une Order');

    const product = await prisma.item.findFirst({ where: { type: ItemType.SERVICE } });
    if (!product) throw new Error('Aucun service trouvé pour créer un OrderItem');

    // Commande simple COMPLETED (démo historique)
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
            status: OrderStatus.COMPLETED,
            productionStatus: ProductionStatus.READY_FOR_DELIVERY,
            paymentStatus: PaymentStatus.PAID,
            amountPaid: 22125,
            paymentDueDate: new Date('2024-07-20'),
            source: OrderSource.MANUAL,
            unitPrice: 75,
            quantity: 250,
        },
    ];

    for (const o of simpleOrders) {
        const contact = await prisma.contact.findUnique({ where: { email: o.customerEmail } });
        if (!contact) { console.warn(`Contact non trouvé: ${o.customerEmail}`); continue; }

        const subsidiary = await prisma.subsidiary.findUnique({ where: { email: o.subsidiaryEmail } });
        if (!subsidiary) { console.warn(`Filiale non trouvée: ${o.subsidiaryEmail}`); continue; }

        const salesRep = await prisma.user.findUnique({ where: { email: o.salesRepEmail } });
        if (!salesRep) { console.warn(`Commercial non trouvé: ${o.salesRepEmail}`); continue; }

        const existing = await prisma.order.findFirst({
            where: { customerId: contact.id, subsidiaryId: subsidiary.id, totalAmount: o.totalAmount },
        });
        if (existing) {
            console.log(`Order déjà existante pour ${contact.email} (${o.totalAmount}), skip`);
            continue;
        }

        const order = await prisma.order.create({
            data: {
                customerId: contact.id,
                customerName: o.customerName,
                subtotal: new Prisma.Decimal(o.subtotal),
                taxAmount: new Prisma.Decimal(o.taxAmount),
                totalAmount: new Prisma.Decimal(o.totalAmount),
                taxRateValue: new Prisma.Decimal(o.taxRateValue),
                status: o.status,
                productionStatus: o.productionStatus,
                paymentStatus: o.paymentStatus,
                amountPaid: new Prisma.Decimal(o.amountPaid),
                paymentDueDate: o.paymentDueDate,
                source: o.source,
                subsidiaryId: subsidiary.id,
                salesRepId: salesRep.id,
                taxRateId: taxRate.id,
                productionHistory: { create: [{ status: o.productionStatus }] },
                orderItems: {
                    create: [{
                        quantity: o.quantity,
                        unitPrice: new Prisma.Decimal(o.unitPrice),
                        discount: 0,
                        total: new Prisma.Decimal(o.quantity * o.unitPrice),
                        productId: product.id,
                    }],
                },
            },
        });
        console.log(`Order ${order.id} créé pour ${contact.email}`);
    }

    // Commandes PENDING_VALIDATION avec specs et étapes de production
    await seedValidationDemoOrders(prisma);
}
