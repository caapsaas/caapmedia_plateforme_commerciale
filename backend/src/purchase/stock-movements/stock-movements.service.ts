import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { Prisma, StockMovementType } from '@prisma/client';
import {
  CreateStockMovementDto,
  FindStockMovementsDto,
  InventoryAdjustmentDto,
  WithdrawForOrderDto,
} from './dto/stock-movement.dto';

// Types qui AJOUTENT au stock — tout le reste retire. Source unique de vérité
// pour le sens d'un mouvement, jamais dupliquée/redéclarée ailleurs.
export const IN_MOVEMENT_TYPES = new Set<StockMovementType>([
  StockMovementType.PURCHASE_RECEIPT,
  StockMovementType.CUSTOMER_RETURN,
  StockMovementType.POSITIVE_ADJUSTMENT,
  StockMovementType.TRANSFER_IN,
]);

// Journal des mouvements de stock (Chantier 3) — toute variation de stock,
// entrée ou sortie, passe par ici. Une sortie de production n'est JAMAIS
// déduite automatiquement d'une commande : toujours saisie manuellement (voir
// withdrawForOrder), le lien à la commande n'étant là que pour la traçabilité.
@Injectable()
export class StockMovementsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(user: any, query: FindStockMovementsDto) {
    return this.prisma.stockMovement.findMany({
      where: {
        subsidiaryId: user.subsidiaryId,
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
    });
  }

  async createManual(dto: CreateStockMovementDto, user: any) {
    const item = await this.prisma.item.findUnique({
      where: { id: dto.itemId },
    });
    if (!item) {
      throw new NotFoundException(
        `Produit avec l'ID "${dto.itemId}" non trouvé`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const delta = IN_MOVEMENT_TYPES.has(dto.type)
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
          itemId: dto.itemId,
          subsidiaryId: user.subsidiaryId,
          stock: Math.max(delta, 0),
        },
      });

      return tx.stockMovement.create({
        data: {
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

  async adjustInventory(dto: InventoryAdjustmentDto, user: any) {
    const item = await this.prisma.item.findUnique({
      where: { id: dto.itemId },
    });
    if (!item) {
      throw new NotFoundException(
        `Produit avec l'ID "${dto.itemId}" non trouvé`,
      );
    }

    const currentLevel = await this.prisma.itemStock.findUnique({
      where: {
        itemId_subsidiaryId: {
          itemId: dto.itemId,
          subsidiaryId: user.subsidiaryId,
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
            subsidiaryId: user.subsidiaryId,
          },
        },
        update: { stock: dto.countedStock },
        create: {
          itemId: dto.itemId,
          subsidiaryId: user.subsidiaryId,
          stock: dto.countedStock,
        },
      });

      const movement = await tx.stockMovement.create({
        data: {
          itemId: dto.itemId,
          subsidiaryId: user.subsidiaryId,
          type:
            delta > 0
              ? StockMovementType.POSITIVE_ADJUSTMENT
              : StockMovementType.NEGATIVE_ADJUSTMENT,
          quantity: Math.abs(delta),
          reason: dto.reason,
          createdById: user.id,
        },
      });

      return { adjusted: true, stock: dto.countedStock, movement };
    });
  }

  async withdrawForOrder(dto: WithdrawForOrderDto, user: any) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
    });
    if (!order || order.subsidiaryId !== user.subsidiaryId) {
      throw new NotFoundException(
        `Commande avec l'ID "${dto.orderId}" non trouvée`,
      );
    }

    const itemIds = dto.items.map((i) => i.itemId);
    const items = await this.prisma.item.findMany({
      where: { id: { in: itemIds } },
    });
    if (items.length !== itemIds.length) {
      throw new BadRequestException(
        'Un ou plusieurs produits sont introuvables.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const movements: Prisma.StockMovementGetPayload<object>[] = [];
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
            itemId: line.itemId,
            subsidiaryId: user.subsidiaryId,
            stock: -line.quantity,
          },
        });

        const movement = await tx.stockMovement.create({
          data: {
            itemId: line.itemId,
            subsidiaryId: user.subsidiaryId,
            type: StockMovementType.PRODUCTION_CONSUMPTION,
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
}
