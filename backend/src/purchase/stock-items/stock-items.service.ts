import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import {
  CreatePackagingUnitDto,
  CreateStockItemDto,
  UpdatePackagingUnitDto,
  UpdateStockItemDto,
  UpdateStockItemPriceDto,
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

  private toFlat(item: ItemWithRelations, subsidiaryId: string) {
    const { stockLevels, ...rest } = item;
    const level = stockLevels[0];
    return {
      ...rest,
      stock: level ? level.stock : 0,
      warehouse: level?.warehouse ?? '',
      subsidiaryId,
    };
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

  async findAll(user: any, subsidiaryId?: string) {
    const isSuperAdmin = user.userRole === 'SUPER_ADMIN';
    const effectiveSid =
      isSuperAdmin && subsidiaryId ? subsidiaryId : user.subsidiaryId;
    const stockLevelsWhere =
      isSuperAdmin && !subsidiaryId ? {} : { subsidiaryId: effectiveSid };

    const items = await this.prisma.item.findMany({
      where: { type: ItemType.STOCK_PRODUCT },
      orderBy: { name: 'asc' },
      include: {
        ...STOCK_ITEM_INCLUDE,
        stockLevels: { where: stockLevelsWhere },
      },
    });
    return items.map((item) => this.toFlat(item, effectiveSid));
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
    return this.toFlat(item, user.subsidiaryId);
  }

  async updatePrice(
    id: string,
    _updateStockItemPriceDto: UpdateStockItemPriceDto,
    user: any,
  ) {
    // Le champ `price` a été supprimé du schéma Item — cette méthode retourne
    // simplement l'article existant sans modification du prix.
    const item = await this.prisma.item.findUnique({
      where: { id },
      include: {
        ...STOCK_ITEM_INCLUDE,
        stockLevels: { where: { subsidiaryId: user.subsidiaryId } },
      },
    });
    if (!item) {
      throw new NotFoundException(`Article avec l'ID "${id}" introuvable`);
    }
    return this.toFlat(item, user.subsidiaryId);
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
