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
exports.StockMovementsService = exports.IN_MOVEMENT_TYPES = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const client_1 = require("@prisma/client");
const generate_id_util_1 = require("../../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../../common/constants/id-prefixes.const");
const pagination_1 = require("../../common/pagination/pagination");
exports.IN_MOVEMENT_TYPES = new Set([
    client_1.StockMovementType.PURCHASE_RECEIPT,
    client_1.StockMovementType.CUSTOMER_RETURN,
    client_1.StockMovementType.POSITIVE_ADJUSTMENT,
    client_1.StockMovementType.TRANSFER_IN,
]);
let StockMovementsService = class StockMovementsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    findAll(user, query) {
        const isSuperAdmin = user.userRole === 'SUPER_ADMIN';
        const subsidiaryWhere = isSuperAdmin
            ? query.subsidiaryId
                ? { subsidiaryId: query.subsidiaryId }
                : {}
            : { subsidiaryId: user.subsidiaryId };
        return (0, pagination_1.paginate)(this.prisma.stockMovement, {
            where: {
                ...subsidiaryWhere,
                ...(query.itemId && { itemId: query.itemId }),
                ...(query.type && { type: query.type }),
                ...(query.startDate || query.endDate
                    ? {
                        createdAt: {
                            ...(query.startDate && { gte: new Date(query.startDate) }),
                            ...(query.endDate && { lte: new Date(query.endDate) }),
                        },
                    }
                    : {}),
            },
            include: { item: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
        }, query);
    }
    async createManual(dto, user) {
        const item = await this.prisma.item.findUnique({
            where: { id: dto.itemId },
        });
        if (!item) {
            throw new common_1.NotFoundException(`Produit avec l'ID "${dto.itemId}" non trouvé`);
        }
        return this.prisma.$transaction(async (tx) => {
            const delta = exports.IN_MOVEMENT_TYPES.has(dto.type)
                ? dto.quantity
                : -dto.quantity;
            await tx.itemStock.upsert({
                where: {
                    itemId_subsidiaryId: {
                        itemId: dto.itemId,
                        subsidiaryId: user.subsidiaryId,
                    },
                },
                update: { stock: { increment: delta } },
                create: {
                    id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ITEMSTOCK),
                    itemId: dto.itemId,
                    subsidiaryId: user.subsidiaryId,
                    stock: Math.max(delta, 0),
                },
            });
            return tx.stockMovement.create({
                data: {
                    id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.STOCKMOVEMENT),
                    itemId: dto.itemId,
                    subsidiaryId: user.subsidiaryId,
                    type: dto.type,
                    quantity: dto.quantity,
                    reason: dto.reason,
                    createdById: user.id,
                },
            });
        });
    }
    async adjustInventory(dto, user) {
        const item = await this.prisma.item.findUnique({
            where: { id: dto.itemId },
        });
        if (!item) {
            throw new common_1.NotFoundException(`Produit avec l'ID "${dto.itemId}" non trouvé`);
        }
        const isSuperAdmin = user.userRole === 'SUPER_ADMIN';
        const targetSubsidiaryId = isSuperAdmin && dto.subsidiaryId ? dto.subsidiaryId : user.subsidiaryId;
        const currentLevel = await this.prisma.itemStock.findUnique({
            where: {
                itemId_subsidiaryId: {
                    itemId: dto.itemId,
                    subsidiaryId: targetSubsidiaryId,
                },
            },
        });
        const currentStock = currentLevel ? Number(currentLevel.stock) : 0;
        const delta = dto.countedStock - currentStock;
        if (delta === 0) {
            return { adjusted: false, stock: currentStock };
        }
        return this.prisma.$transaction(async (tx) => {
            await tx.itemStock.upsert({
                where: {
                    itemId_subsidiaryId: {
                        itemId: dto.itemId,
                        subsidiaryId: targetSubsidiaryId,
                    },
                },
                update: { stock: dto.countedStock },
                create: {
                    id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ITEMSTOCK),
                    itemId: dto.itemId,
                    subsidiaryId: targetSubsidiaryId,
                    stock: dto.countedStock,
                },
            });
            const movement = await tx.stockMovement.create({
                data: {
                    id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.STOCKMOVEMENT),
                    itemId: dto.itemId,
                    subsidiaryId: targetSubsidiaryId,
                    type: delta > 0
                        ? client_1.StockMovementType.POSITIVE_ADJUSTMENT
                        : client_1.StockMovementType.NEGATIVE_ADJUSTMENT,
                    quantity: Math.abs(delta),
                    reason: dto.reason,
                    createdById: user.id,
                },
            });
            return { adjusted: true, stock: dto.countedStock, movement };
        });
    }
    async withdrawForOrder(dto, user) {
        const order = await this.prisma.order.findUnique({
            where: { id: dto.orderId },
        });
        if (!order || order.subsidiaryId !== user.subsidiaryId) {
            throw new common_1.NotFoundException(`Commande avec l'ID "${dto.orderId}" non trouvée`);
        }
        const itemIds = dto.items.map((i) => i.itemId);
        const items = await this.prisma.item.findMany({
            where: { id: { in: itemIds } },
        });
        if (items.length !== itemIds.length) {
            throw new common_1.BadRequestException('Un ou plusieurs produits sont introuvables.');
        }
        return this.prisma.$transaction(async (tx) => {
            const movements = [];
            for (const line of dto.items) {
                await tx.itemStock.upsert({
                    where: {
                        itemId_subsidiaryId: {
                            itemId: line.itemId,
                            subsidiaryId: user.subsidiaryId,
                        },
                    },
                    update: { stock: { decrement: line.quantity } },
                    create: {
                        id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.ITEMSTOCK),
                        itemId: line.itemId,
                        subsidiaryId: user.subsidiaryId,
                        stock: -line.quantity,
                    },
                });
                const movement = await tx.stockMovement.create({
                    data: {
                        id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.STOCKMOVEMENT),
                        itemId: line.itemId,
                        subsidiaryId: user.subsidiaryId,
                        type: client_1.StockMovementType.PRODUCTION_CONSUMPTION,
                        quantity: line.quantity,
                        orderId: dto.orderId,
                        createdById: user.id,
                    },
                });
                movements.push(movement);
            }
            return movements;
        });
    }
};
exports.StockMovementsService = StockMovementsService;
exports.StockMovementsService = StockMovementsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StockMovementsService);
//# sourceMappingURL=stock-movements.service.js.map