import {
  PrismaClient,
  PurchaseOrderStatus,
  PaymentStatus,
  PaymentTerms,
  DebtStatus,
  ItemType,
} from '@prisma/client';
import { generateId } from './generate-id.util';
import { ID_PREFIXES } from './id-prefixes.const';
import { STOCK_PRODUCTS_DATA } from './product.seeder';
// STOCK_PRODUCTS_DATA est utilisé uniquement comme référentiel de prix
// (name → price). Les Items de stock sont globaux en base : la boucle de
// seedOpeningStockPurchases requête directement prisma.item pour les trouver
// sans dépendre du champ subsidiaryEmail de STOCK_PRODUCTS_DATA.

// Seeder idempotent (rejouable sans dupliquer) qui peuple des bons de
// commande fournisseur réalistes par filiale — nécessaire pour que
// "Dettes fournisseurs" ait des données de démo, puisqu'une dette
// fournisseur résulte TOUJOURS d'un achat non payé et n'est plus jamais
// créée à la main (voir DebtsService/PurchaseOrdersService.create). Chaque
// bon de commande créé ici pose donc AUSSI sa dette liée, exactement comme
// le fait le vrai service — sinon "Dettes fournisseurs" resterait vide.
interface PurchaseOrderItemSeed {
  productName: string;
  quantity: number;
  purchasePrice: number;
}

interface PurchaseOrderSeed {
  supplierName: string;
  items: PurchaseOrderItemSeed[];
  daysAgo: number;
  paymentTerms: PaymentTerms;
  // 0 = UNPAID (dette intégrale), 0<r<1 = PARTIALLY_PAID (dette partielle),
  // 1 = PAID (dette soldée, status PAYER) — jamais de mouvement de trésorerie
  // simulé ici (comptes de trésorerie déjà seedés séparément, voir
  // treasury.seeder.ts), uniquement les montants/statuts eux-mêmes.
  amountPaidRatio: number;
}

interface SubsidiaryPurchaseConfig {
  subsidiaryEmail: string;
  orders: PurchaseOrderSeed[];
}

const CONFIGS: SubsidiaryPurchaseConfig[] = [
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
        paymentTerms: PaymentTerms.CREDIT,
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
        paymentTerms: PaymentTerms.CREDIT,
        amountPaidRatio: 0.5,
      },
      {
        supplierName: 'SONARA',
        items: [{ productName: 'Agrafes', quantity: 100, purchasePrice: 500 }],
        daysAgo: 40,
        paymentTerms: PaymentTerms.IMMEDIATE,
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
        paymentTerms: PaymentTerms.CREDIT,
        amountPaidRatio: 0,
      },
      {
        supplierName: 'CAMWATER',
        items: [{ productName: 'Agrafes', quantity: 60, purchasePrice: 500 }],
        daysAgo: 18,
        paymentTerms: PaymentTerms.CREDIT,
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
        paymentTerms: PaymentTerms.CREDIT,
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
        paymentTerms: PaymentTerms.CREDIT,
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
        paymentTerms: PaymentTerms.CREDIT,
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
        paymentTerms: PaymentTerms.CREDIT,
        amountPaidRatio: 0.3,
      },
    ],
  },
];

// Fournisseur générique utilisé uniquement pour poser le "prix de revient"
// initial — un seul BO d'ouverture par filiale couvrant TOUS les articles de
// stock globaux existants en base. Sans lui, costPrice reste null pour tout
// article n'ayant pas encore de commande réelle (voir stock-items.service.ts).
const OPENING_STOCK_SUPPLIER = {
  supplierName: 'Fournisseur Stock Initial',
  company: 'Stock Initial (solde d\'ouverture)',
  email: 'stock-initial@caap.cm',
  phone: '2333330099',
  address: 'N/A',
};

// Date volontairement plus ancienne que toutes les commandes de CONFIGS
// (8 à 40 jours) : getLatestCostPrices() prend le PurchaseOrderItem le plus
// récent par produit, donc les articles couverts par CONFIGS gardent leur prix
// le plus récent — celui-ci ne sert que de socle initial pour les autres.
const OPENING_STOCK_DAYS_AGO = 90;

async function seedOpeningStockPurchases(prisma: PrismaClient) {
  // Référentiel de prix : nom → prix d'achat de référence (issu de
  // STOCK_PRODUCTS_DATA). Les Items sont globaux donc pas de filtrage filiale.
  const priceByName = new Map<string, number>();
  for (const p of STOCK_PRODUCTS_DATA) {
    if (!priceByName.has(p.name)) {
      priceByName.set(p.name, p.price);
    }
  }

  // Tous les articles de stock globaux présents en base (créés par
  // product.seeder.ts — globaux, pas scopés filiale).
  const allStockItems = await prisma.item.findMany({
    where: { type: ItemType.STOCK_PRODUCT },
    select: { id: true, name: true },
  });

  if (allStockItems.length === 0) {
    console.warn(
      'Aucun article de stock en base — seedOpeningStockPurchases ignoré.',
    );
    return;
  }

  // Toutes les filiales — le BO d'ouverture couvre chacune d'elles.
  const subsidiaries = await prisma.subsidiary.findMany();

  for (const subsidiary of subsidiaries) {
    // Upsert fournisseur générique pour cette filiale.
    const supplier = await prisma.supplier.upsert({
      where: {
        supplierName_subsidiaryId: {
          supplierName: OPENING_STOCK_SUPPLIER.supplierName,
          subsidiaryId: subsidiary.id,
        },
      },
      update: {},
      create: {
        id: generateId(ID_PREFIXES.SUPPLIER),
        supplierName: OPENING_STOCK_SUPPLIER.supplierName,
        company: OPENING_STOCK_SUPPLIER.company,
        email: OPENING_STOCK_SUPPLIER.email,
        phone: OPENING_STOCK_SUPPLIER.phone,
        address: OPENING_STOCK_SUPPLIER.address,
        subsidiaryId: subsidiary.id,
      },
    });

    // Idempotence robuste : on vérifie par (fournisseur + filiale) sans
    // dépendre d'un productId qui pourrait manquer côté itemsData.
    const existing = await prisma.purchaseOrder.findFirst({
      where: { supplierId: supplier.id, subsidiaryId: subsidiary.id },
    });
    if (existing) continue;

    // Construire les lignes du BO pour tous les articles globaux.
    const itemsData: {
      productName: string;
      quantity: number;
      quantityReceived: number;
      purchasePrice: number;
      productId: string;
    }[] = [];
    let totalAmount = 0;

    for (const item of allStockItems) {
      // Prix de référence issu de STOCK_PRODUCTS_DATA ; 5 000 FCFA par défaut
      // pour tout article ajouté manuellement hors catalogue seed.
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
        status: PurchaseOrderStatus.RECEIVED,
        paymentTerms: PaymentTerms.IMMEDIATE,
        paymentStatus: PaymentStatus.PAID,
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

    // Dette immédiatement soldée (payée intégralement à l'ouverture).
    await prisma.supplierDebt.create({
      data: {
        supplierName: supplier.supplierName,
        invoiceId: `PO-${purchaseOrder.id.substring(0, 8)}`,
        dueDate: expectedDeliveryDate,
        amount: 0,
        status: DebtStatus.PAYER,
        purchaseOrderId: purchaseOrder.id,
        subsidiaryId: subsidiary.id,
      },
    });

    console.log(
      `BO d'ouverture ${purchaseOrder.id} créé — ${itemsData.length} articles pour « ${subsidiary.subsidiaryName ?? subsidiary.id} »`,
    );
  }

  console.log("Prix de revient initiaux (solde d'ouverture) seedés");
}

export async function runPurchaseOrderSeeder(prisma: PrismaClient) {
  await seedOpeningStockPurchases(prisma);

  for (const config of CONFIGS) {
    const subsidiary = await prisma.subsidiary.findUnique({
      where: { email: config.subsidiaryEmail },
    });
    if (!subsidiary) {
      console.warn(
        `Filiale introuvable pour ${config.subsidiaryEmail}, bons de commande ignorés`,
      );
      continue;
    }

    for (const o of config.orders) {
      const supplier = await prisma.supplier.findFirst({
        where: { supplierName: o.supplierName, subsidiaryId: subsidiary.id },
      });
      if (!supplier) {
        console.warn(
          `Fournisseur "${o.supplierName}" introuvable pour ${config.subsidiaryEmail}, bon de commande ignoré`,
        );
        continue;
      }

      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - o.daysAgo);
      const expectedDeliveryDate = new Date(orderDate);
      expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 14);

      const itemsData: {
        productName: string;
        quantity: number;
        quantityReceived: number;
        purchasePrice: number;
        productId: string;
      }[] = [];
      let totalAmount = 0;
      let skip = false;

      for (const item of o.items) {
        const product = await prisma.item.findFirst({
          where: { name: item.productName, type: ItemType.STOCK_PRODUCT },
        });
        if (!product) {
          console.warn(
            `Article de stock "${item.productName}" introuvable, bon de commande pour ${o.supplierName} ignoré`,
          );
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
      if (skip || itemsData.length === 0) continue;

      // Idempotent par (fournisseur + filiale + premier produit) — PAS par
      // date : orderDate = "aujourd'hui - daysAgo" se déplace à chaque
      // exécution, une vérification par date créerait un doublon à chaque
      // `npm run seed` lancé un jour différent (bug identique et corrigé
      // dans movements.seeder.ts).
      const existing = await prisma.purchaseOrder.findFirst({
        where: {
          supplierId: supplier.id,
          subsidiaryId: subsidiary.id,
          purchaseOrderItems: { some: { productId: itemsData[0].productId } },
        },
      });
      if (existing) continue;

      const amountPaid = Math.round(totalAmount * o.amountPaidRatio);
      const paymentStatus =
        o.amountPaidRatio >= 1
          ? PaymentStatus.PAID
          : o.amountPaidRatio > 0
            ? PaymentStatus.PARTIALLY_PAID
            : PaymentStatus.UNPAID;

      const purchaseOrder = await prisma.purchaseOrder.create({
        data: {
          supplierName: supplier.supplierName,
          orderDate,
          expectedDeliveryDate,
          totalAmount,
          amountPaid,
          status: PurchaseOrderStatus.ORDERED,
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

      // Une dette fournisseur résulte TOUJOURS d'un achat non payé — posée
      // ici comme le fait purchase-orders.service.ts::create() en production.
      const remainingAmount = totalAmount - amountPaid;
      await prisma.supplierDebt.create({
        data: {
          supplierName: supplier.supplierName,
          invoiceId: `PO-${purchaseOrder.id.substring(0, 8)}`,
          dueDate: expectedDeliveryDate,
          amount: remainingAmount,
          status:
            remainingAmount <= 0
              ? DebtStatus.PAYER
              : amountPaid > 0
                ? DebtStatus.PARTIELLEMENT_PAYE
                : DebtStatus.A_PAYER,
          purchaseOrderId: purchaseOrder.id,
          subsidiaryId: subsidiary.id,
        },
      });

      console.log(
        `Bon de commande ${purchaseOrder.id} créé pour ${o.supplierName} (${config.subsidiaryEmail}) — ${paymentStatus}`,
      );
    }
  }

  console.log('Bons de commande / dettes fournisseurs seedés');
}
