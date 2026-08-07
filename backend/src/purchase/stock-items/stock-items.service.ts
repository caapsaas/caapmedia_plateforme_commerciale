import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import {
  CreatePackagingUnitDto,
  CreateStockItemDto,
  UpdatePackagingUnitDto,
  UpdateStockItemDto,
} from './dto/create-stock-item.dto';
import {
  Item,
  ItemStock,
  ItemPackagingUnit,
  ItemType,
  Unit,
} from '@prisma/client';
import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';
import { paginate } from 'src/common/pagination/pagination';
import type { Prisma } from '@prisma/client';

type ItemWithRelations = Item & {
  stockLevels: ItemStock[];
  baseUnit: Unit | null;
  packagingUnits: (ItemPackagingUnit & { unit: Unit })[];
};

const STOCK_ITEM_INCLUDE = {
  baseUnit: true,
  packagingUnits: { include: { unit: true } },
} as const;

// CRUD des produits de stock (matières premières/consommables, Chantier 1) —
// l'Item est un catalogue GLOBAL (comme les services) ; seule la quantité en
// stock (et l'entrepôt) est propre à chaque filiale, voir ItemStock. Cette
// couche fusionne les deux pour exposer la même forme plate qu'avant côté API.
@Injectable()
export class StockItemsService {
  constructor(private readonly prisma: PrismaService) {}

  // Aplatit un Item avec un seul niveau de stock (vue filtrée par filiale).
  private toFlat(
    item: ItemWithRelations,
    subsidiaryId: string,
    costPrice?: Prisma.Decimal | null,
  ) {
    const { stockLevels, ...rest } = item;
    const level = stockLevels[0];
    return {
      ...rest,
      stock: level ? Number(level.stock) : 0,
      warehouse: level?.warehouse ?? '',
      subsidiaryId,
      costPrice: costPrice != null ? costPrice.toNumber() : null,
    };
  }

  // Vue consolidée (SUPER_ADMIN sans filtre) : somme les stocks de toutes les
  // filiales et retourne un seul enregistrement par article global.
  private toFlatConsolidated(
    item: ItemWithRelations,
    costPrice?: Prisma.Decimal | null,
  ) {
    const { stockLevels, ...rest } = item;
    const totalStock = stockLevels.reduce(
      (sum, lvl) => sum + Number(lvl.stock),
      0,
    );
    return {
      ...rest,
      stock: totalStock,
      warehouse: 'Toutes filiales',
      subsidiaryId: 'consolidated',
      costPrice: costPrice != null ? costPrice.toNumber() : null,
    };
  }

  // Dernier prix d'achat connu par produit — une seule requête groupée (pas
  // de N+1), triée par date de commande décroissante : le premier
  // PurchaseOrderItem rencontré pour un productId donné est le plus récent.
  private async getLatestCostPrices(
    itemIds: string[],
  ): Promise<Map<string, Prisma.Decimal>> {
    if (itemIds.length === 0) return new Map();
    const recentPurchaseItems = await this.prisma.purchaseOrderItem.findMany({
      where: { productId: { in: itemIds } },
      orderBy: { purchaseOrder: { orderDate: 'desc' } },
      select: { productId: true, purchasePrice: true },
    });
    const costPriceByItemId = new Map<string, Prisma.Decimal>();
    for (const poi of recentPurchaseItems) {
      if (!costPriceByItemId.has(poi.productId)) {
        costPriceByItemId.set(poi.productId, poi.purchasePrice);
      }
    }
    return costPriceByItemId;
  }

  async create(createStockItemDto: CreateStockItemDto, user: any) {
    const { stock, warehouse, ...itemData } = createStockItemDto;

    // Un article de stock est global : si un article du même nom existe déjà
    // (créé par une autre filiale), on ne le duplique pas — on ajoute juste
    // le niveau de stock de cette filiale dessus.
    const existing = await this.prisma.item.findFirst({
      where: { name: createStockItemDto.name, type: ItemType.STOCK_PRODUCT },
      include: STOCK_ITEM_INCLUDE,
    });

    if (existing) {
      const level = await this.prisma.itemStock.upsert({
        where: {
          itemId_subsidiaryId: {
            itemId: existing.id,
            subsidiaryId: user.subsidiaryId,
          },
        },
        update: { stock: stock ?? 0, warehouse },
        create: {
          id: generateId(ID_PREFIXES.ITEMSTOCK),
          itemId: existing.id,
          subsidiaryId: user.subsidiaryId,
          stock: stock ?? 0,
          warehouse,
        },
      });
      return this.toFlat(
        { ...existing, stockLevels: [level] },
        user.subsidiaryId,
      );
    }

    const item = await this.prisma.item.create({
      data: {
        id: generateId(ID_PREFIXES.PRODUCT),
        ...itemData,
        type: ItemType.STOCK_PRODUCT,
        stockLevels: {
          create: {
            id: generateId(ID_PREFIXES.ITEMSTOCK),
            subsidiaryId: user.subsidiaryId,
            stock: stock ?? 0,
            warehouse,
          },
        },
      },
      include: {
        ...STOCK_ITEM_INCLUDE,
        stockLevels: { where: { subsidiaryId: user.subsidiaryId } },
      },
    });
    return this.toFlat(item, user.subsidiaryId);
  }

  async findAll(
    user: any,
    paginationQuery: PaginationQueryDto,
    subsidiaryId?: string,
  ) {
    const isSuperAdmin = user.userRole === 'SUPER_ADMIN';
    // Vue consolidée : SUPER_ADMIN sans filtre de filiale.
    const isConsolidated = isSuperAdmin && !subsidiaryId;
    const effectiveSid =
      isSuperAdmin && subsidiaryId ? subsidiaryId : user.subsidiaryId;
    const stockLevelsWhere = isConsolidated ? {} : { subsidiaryId: effectiveSid };

    const where: Prisma.ItemWhereInput = { type: ItemType.STOCK_PRODUCT };
    if (paginationQuery.search) {
      where.name = { contains: paginationQuery.search, mode: 'insensitive' };
    }

    const result = await paginate<ItemWithRelations>(
      // Le délégué Prisma généré a des surcharges de findMany() par forme
      // d'`include` que l'interface générique PaginatableModel<T> ne peut pas
      // unifier structurellement — cast nécessaire, la forme réelle de la
      // requête (via `include` ci-dessous) reste correcte et vérifiée.
      this.prisma.item as unknown as Parameters<
        typeof paginate<ItemWithRelations>
      >[0],
      {
        where,
        orderBy: { name: 'asc' },
        include: {
          ...STOCK_ITEM_INCLUDE,
          // En vue consolidée on charge TOUS les niveaux pour les sommer ;
          // en vue filtrée on ne charge que celui de la filiale concernée.
          stockLevels: { where: stockLevelsWhere },
        },
      },
      paginationQuery,
    );

    const costPriceByItemId = await this.getLatestCostPrices(
      result.data.map((item) => item.id),
    );

    return {
      ...result,
      data: result.data.map((item) =>
        isConsolidated
          ? this.toFlatConsolidated(item, costPriceByItemId.get(item.id))
          : this.toFlat(item, effectiveSid, costPriceByItemId.get(item.id)),
      ),
    };
  }

  async findOne(id: string, user: any) {
    const item = await this.prisma.item.findFirst({
      where: { id, type: ItemType.STOCK_PRODUCT },
      include: {
        ...STOCK_ITEM_INCLUDE,
        stockLevels: { where: { subsidiaryId: user.subsidiaryId } },
      },
    });

    if (!item) {
      throw new NotFoundException(
        `Produit de stock avec l'ID "${id}" non trouvé`,
      );
    }
    const costPriceByItemId = await this.getLatestCostPrices([item.id]);
    return this.toFlat(item, user.subsidiaryId, costPriceByItemId.get(id));
  }

  async update(id: string, updateStockItemDto: UpdateStockItemDto, user: any) {
    await this.findOne(id, user);
    const { stock, warehouse, ...itemData } = updateStockItemDto;

    if (stock !== undefined || warehouse !== undefined) {
      await this.prisma.itemStock.upsert({
        where: {
          itemId_subsidiaryId: { itemId: id, subsidiaryId: user.subsidiaryId },
        },
        update: {
          ...(stock !== undefined && { stock }),
          ...(warehouse !== undefined && { warehouse }),
        },
        create: {
          id: generateId(ID_PREFIXES.ITEMSTOCK),
          itemId: id,
          subsidiaryId: user.subsidiaryId,
          stock: stock ?? 0,
          warehouse,
        },
      });
    }

    const item = await this.prisma.item.update({
      where: { id },
      data: itemData,
      include: {
        ...STOCK_ITEM_INCLUDE,
        stockLevels: { where: { subsidiaryId: user.subsidiaryId } },
      },
    });
    return this.toFlat(item, user.subsidiaryId);
  }

  async remove(id: string, user: any) {
    await this.findOne(id, user);
    // Ne supprime jamais l'Item global (partagé entre filiales, référencé par
    // l'historique achats/commandes/CRM d'autres filiales) — seulement le
    // niveau de stock de la filiale courante.
    await this.prisma.itemStock.deleteMany({
      where: { itemId: id, subsidiaryId: user.subsidiaryId },
    });
    return { id };
  }

  // --- Unités d'emballage/achat (Chantier 2) ---

  async listPackagingUnits(itemId: string, user: any) {
    await this.findOne(itemId, user);
    return this.prisma.itemPackagingUnit.findMany({
      where: { itemId },
      include: { unit: true },
    });
  }

  async addPackagingUnit(
    itemId: string,
    dto: CreatePackagingUnitDto,
    user: any,
  ) {
    await this.findOne(itemId, user);
    return this.prisma.itemPackagingUnit.create({
      data: {
        id: generateId(ID_PREFIXES.ITEMPACKAGINGUNIT),
        itemId,
        unitId: dto.unitId,
        conversionFactor: dto.conversionFactor,
      },
      include: { unit: true },
    });
  }

  async updatePackagingUnit(
    packagingUnitId: string,
    dto: UpdatePackagingUnitDto,
  ) {
    await this.findPackagingUnitOrThrow(packagingUnitId);
    return this.prisma.itemPackagingUnit.update({
      where: { id: packagingUnitId },
      data: dto,
      include: { unit: true },
    });
  }

  async removePackagingUnit(packagingUnitId: string) {
    await this.findPackagingUnitOrThrow(packagingUnitId);
    await this.prisma.itemPackagingUnit.delete({
      where: { id: packagingUnitId },
    });
    return { id: packagingUnitId };
  }

  private async findPackagingUnitOrThrow(packagingUnitId: string) {
    const packagingUnit = await this.prisma.itemPackagingUnit.findUnique({
      where: { id: packagingUnitId },
    });
    if (!packagingUnit) {
      throw new NotFoundException(
        `Unité d'emballage avec l'ID "${packagingUnitId}" non trouvée`,
      );
    }
    return packagingUnit;
  }
}
