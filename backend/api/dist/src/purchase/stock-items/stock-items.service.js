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
exports.StockItemsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const client_1 = require("@prisma/client");
const generate_id_util_1 = require("../../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../../common/constants/id-prefixes.const");
const pagination_1 = require("../../common/pagination/pagination");
const STOCK_ITEM_INCLUDE = {
    baseUnit: true,
    packagingUnits: { include: { unit: true } },
};
let StockItemsService = class StockItemsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    toFlat(item, subsidiaryId, costPrice) {
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
    toFlatConsolidated(item, costPrice) {
        const { stockLevels, ...rest } = item;
        const totalStock = stockLevels.reduce((sum, lvl) => sum + Number(lvl.stock), 0);
        return {
            ...rest,
            stock: totalStock,
            warehouse: 'Toutes filiales',
            subsidiaryId: 'consolidated',
            costPrice: costPrice != null ? costPrice.toNumber() : null,
        };
    }
    async getLatestCostPrices(itemIds) {
        if (itemIds.length === 0)
            return new Map();
        const recentPurchaseItems = await this.prisma.purchaseOrderItem.findMany({
            where: { productId: { in: itemIds } },
            orderBy: { purchaseOrder: { orderDate: 'desc' } },
            select: { productId: true, purchasePrice: true },
        });
        const costPriceByItemId = new Map();
        for (const poi of recentPurchaseItems) {
            if (!costPriceByItemId.has(poi.productId)) {
                costPriceByItemId.set(poi.productId, poi.purchasePrice);
            }
        }
        return costPriceByItemId;
    }
    async create(createStockItemDto, user) {
        const { stock, warehouse, ...itemData } = createStockItemDto;
        const existing = await this.prisma.item.findFirst({
            where: { name: createStockItemDto.name, type: client_1.ItemType.STOCK_PRODUCT },
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
                    id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ITEMSTOCK),
                    itemId: existing.id,
                    subsidiaryId: user.subsidiaryId,
                    stock: stock ?? 0,
                    warehouse,
                },
            });
            return this.toFlat({ ...existing, stockLevels: [level] }, user.subsidiaryId);
        }
        const item = await this.prisma.item.create({
            data: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.PRODUCT),
                ...itemData,
                type: client_1.ItemType.STOCK_PRODUCT,
                stockLevels: {
                    create: {
                        id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ITEMSTOCK),
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
    async findAll(user, paginationQuery, subsidiaryId) {
        const isSuperAdmin = user.userRole === 'SUPER_ADMIN';
        const isConsolidated = isSuperAdmin && !subsidiaryId;
        const effectiveSid = isSuperAdmin && subsidiaryId ? subsidiaryId : user.subsidiaryId;
        const stockLevelsWhere = isConsolidated ? {} : { subsidiaryId: effectiveSid };
        const where = { type: client_1.ItemType.STOCK_PRODUCT };
        if (paginationQuery.search) {
            where.name = { contains: paginationQuery.search, mode: 'insensitive' };
        }
        const result = await (0, pagination_1.paginate)(this.prisma.item, {
            where,
            orderBy: { name: 'asc' },
            include: {
                ...STOCK_ITEM_INCLUDE,
                stockLevels: { where: stockLevelsWhere },
            },
        }, paginationQuery);
        const costPriceByItemId = await this.getLatestCostPrices(result.data.map((item) => item.id));
        return {
            ...result,
            data: result.data.map((item) => isConsolidated
                ? this.toFlatConsolidated(item, costPriceByItemId.get(item.id))
                : this.toFlat(item, effectiveSid, costPriceByItemId.get(item.id))),
        };
    }
    async findOne(id, user) {
        const item = await this.prisma.item.findFirst({
            where: { id, type: client_1.ItemType.STOCK_PRODUCT },
            include: {
                ...STOCK_ITEM_INCLUDE,
                stockLevels: { where: { subsidiaryId: user.subsidiaryId } },
            },
        });
        if (!item) {
            throw new common_1.NotFoundException(`Produit de stock avec l'ID "${id}" non trouvé`);
        }
        const costPriceByItemId = await this.getLatestCostPrices([item.id]);
        return this.toFlat(item, user.subsidiaryId, costPriceByItemId.get(id));
    }
    async update(id, updateStockItemDto, user) {
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
                    id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ITEMSTOCK),
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
    async remove(id, user) {
        await this.findOne(id, user);
        await this.prisma.itemStock.deleteMany({
            where: { itemId: id, subsidiaryId: user.subsidiaryId },
        });
        return { id };
    }
    async listPackagingUnits(itemId, user) {
        await this.findOne(itemId, user);
        return this.prisma.itemPackagingUnit.findMany({
            where: { itemId },
            include: { unit: true },
        });
    }
    async addPackagingUnit(itemId, dto, user) {
        await this.findOne(itemId, user);
        return this.prisma.itemPackagingUnit.create({
            data: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ITEMPACKAGINGUNIT),
                itemId,
                unitId: dto.unitId,
                conversionFactor: dto.conversionFactor,
            },
            include: { unit: true },
        });
    }
    async updatePackagingUnit(packagingUnitId, dto) {
        await this.findPackagingUnitOrThrow(packagingUnitId);
        return this.prisma.itemPackagingUnit.update({
            where: { id: packagingUnitId },
            data: dto,
            include: { unit: true },
        });
    }
    async removePackagingUnit(packagingUnitId) {
        await this.findPackagingUnitOrThrow(packagingUnitId);
        await this.prisma.itemPackagingUnit.delete({
            where: { id: packagingUnitId },
        });
        return { id: packagingUnitId };
    }
    async findPackagingUnitOrThrow(packagingUnitId) {
        const packagingUnit = await this.prisma.itemPackagingUnit.findUnique({
            where: { id: packagingUnitId },
        });
        if (!packagingUnit) {
            throw new common_1.NotFoundException(`Unité d'emballage avec l'ID "${packagingUnitId}" non trouvée`);
        }
        return packagingUnit;
    }
};
exports.StockItemsService = StockItemsService;
exports.StockItemsService = StockItemsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StockItemsService);
//# sourceMappingURL=stock-items.service.js.map