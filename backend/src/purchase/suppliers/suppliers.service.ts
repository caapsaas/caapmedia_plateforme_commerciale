import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import {
  CreateSupplierDto,
  UpdateSupplierDto,
} from './dto/create-supplier.dto';
import { Prisma, TransactionStatus, TransactionType } from '@prisma/client';
import { IN_MOVEMENT_TYPES } from '../stock-movements/stock-movements.service';
import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';
import {
  resolveScopeContext,
  withSubsidiaryScope,
  assertSubsidiaryAccess,
} from 'src/common/utils/subsidiary-scope';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';
import { paginate, PaginatedResult } from 'src/common/pagination/pagination';
import type { Supplier } from '@prisma/client';
import type { ScopableUser } from 'src/common/utils/subsidiary-scope';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Methode pour creer un fournisseur
   * @param createSupplierDto Dto contenant les donnees pour creation d'un fournisseur
   * @param user Utilisateur connecte
   * @returns Un fournisseur Cree
   */
  async create(createSupplierDto: CreateSupplierDto, user: ScopableUser) {
    const { subsidiaryId } = user;

    const existingSupplier = await this.prisma.supplier.findFirst({
      where: {
        supplierName: createSupplierDto.supplierName,
        subsidiaryId: subsidiaryId,
      },
    });

    if (existingSupplier) {
      throw new ConflictException(
        `Un fournisseur avec le nom "${createSupplierDto.supplierName}" existe déjà dans cette filiale.`,
      );
    }

    return this.prisma.supplier.create({
      data: {
        id: generateId(ID_PREFIXES.SUPPLIER),
        ...createSupplierDto,
        subsidiaryId: subsidiaryId,
      },
    });
  }

  /**
   * Methode pour recuperer les fournisseurs : vue globale (toutes filiales)
   * pour SUPER_ADMIN, scope filiale sinon. `subsidiaryId` permet un
   * drill-down explicite depuis une vue consolidee.
   * @param user Utilisateur connecte
   * @returns Les fournisseurs visibles par l'utilisateur
   */
  async findAll(
    user: ScopableUser,
    paginationQuery: PaginationQueryDto,
    subsidiaryId?: string,
  ): Promise<PaginatedResult<Supplier>> {
    const ctx = resolveScopeContext(user);
    const where: Prisma.SupplierWhereInput = withSubsidiaryScope(
      {},
      ctx,
      subsidiaryId,
    );

    if (paginationQuery.search) {
      where.OR = [
        {
          supplierName: {
            contains: paginationQuery.search,
            mode: 'insensitive',
          },
        },
        { company: { contains: paginationQuery.search, mode: 'insensitive' } },
        { email: { contains: paginationQuery.search, mode: 'insensitive' } },
      ];
    }

    return paginate<Supplier>(
      this.prisma.supplier,
      { where, orderBy: { supplierName: 'asc' } },
      paginationQuery,
    );
  }

  /**
   * Methode pour recuperer un fournisseur
   * @param id ID du fournisseur
   * @param user Utilisateur connecte
   * @returns Un fournisseur
   */
  async findOne(id: string, user: ScopableUser) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
    });

    if (!supplier) {
      throw new NotFoundException(`Fournisseur avec l'ID "${id}" non trouvé.`);
    }
    assertSubsidiaryAccess(supplier.subsidiaryId, resolveScopeContext(user));
    return supplier;
  }

  /**
   * Methode pour mettre a jour un fournisseur
   * @param id ID du fournisseur
   * @param updateSupplierDto Dto contenant les donnees pour mise a jour d'un fournisseur
   * @param user Utilisateur connecte
   * @returns Un fournisseur mis a jour
   */
  async update(
    id: string,
    updateSupplierDto: UpdateSupplierDto,
    user: ScopableUser,
  ) {
    await this.findOne(id, user);
    return this.prisma.supplier.update({
      where: { id },
      data: updateSupplierDto,
    });
  }

  /**
   * Methode pour supprimer un fournisseur
   * @param id ID du fournisseur
   * @param user Utilisateur connecte
   * @returns Un fournisseur supprime
   */
  async remove(id: string, user: ScopableUser) {
    return this.prisma.$transaction(
      async (tx) => {
        const supplier = await tx.supplier.findUnique({ where: { id } });
        if (!supplier) {
          throw new NotFoundException(
            `Fournisseur avec l'ID "${id}" non trouvé.`,
          );
        }
        assertSubsidiaryAccess(
          supplier.subsidiaryId,
          resolveScopeContext(user),
        );

        const orders = await tx.purchaseOrder.findMany({
          where: { supplierId: id },
          select: { id: true, supplierDebts: { select: { id: true } } },
        });
        const orderIds = orders.map((order) => order.id);
        const documentIds = [
          id,
          ...orderIds,
          ...orders.flatMap((order) =>
            order.supplierDebts.map((debt) => debt.id),
          ),
        ];
        // Payments can belong to the headquarters account's subsidiary.
        // Match their explicit document link, never a supplier name.
        const payments = await tx.financialTransaction.findMany({
          where: { relatedDocumentId: { in: documentIds } },
        });
        for (const payment of payments) {
          if (payment.status !== TransactionStatus.VALIDE) continue;
          const delta =
            payment.financialTransactionType === TransactionType.DEPENSE
              ? payment.amount
              : payment.amount.negated();
          await tx.treasuryAccount.update({
            where: { id: payment.sourceAccountId ?? payment.treasuryAccountId },
            data: { balance: { increment: delta } },
          });
          if (payment.destinationAccountId) {
            await tx.treasuryAccount.update({
              where: { id: payment.destinationAccountId },
              data: { balance: { decrement: payment.amount } },
            });
          }
        }

        const sourceIds = [
          ...documentIds,
          ...payments.map((payment) => payment.id),
        ];
        await tx.accountingOutboxEntry.deleteMany({
          where: {
            OR: sourceIds.map((sourceId) => ({
              payload: { path: ['sourceId'], equals: sourceId },
            })),
          },
        });
        // Include reversals before removing the source entries and their lines.
        let entries = await tx.journalEntry.findMany({
          where: { sourceId: { in: sourceIds } },
          select: { id: true },
        });
        const entryIds = new Set(entries.map((entry) => entry.id));
        while (entries.length) {
          entries = await tx.journalEntry.findMany({
            where: {
              reversalOfEntryId: { in: entries.map((entry) => entry.id) },
              id: { notIn: [...entryIds] },
            },
            select: { id: true },
          });
          entries.forEach((entry) => entryIds.add(entry.id));
        }
        if (entryIds.size) {
          await tx.journalEntry.updateMany({
            where: { id: { in: [...entryIds] } },
            data: { reversalOfEntryId: null },
          });
          await tx.journalEntry.deleteMany({
            where: { id: { in: [...entryIds] } },
          });
        }
        await tx.financialTransaction.deleteMany({
          where: { id: { in: payments.map((payment) => payment.id) } },
        });

        const movements = await tx.stockMovement.findMany({
          where: { purchaseOrderId: { in: orderIds } },
        });
        for (const movement of movements) {
          const delta = IN_MOVEMENT_TYPES.has(movement.type)
            ? movement.quantity.negated()
            : movement.quantity;
          await tx.itemStock.update({
            where: {
              itemId_subsidiaryId: {
                itemId: movement.itemId,
                subsidiaryId: movement.subsidiaryId,
              },
            },
            data: { stock: { increment: delta } },
          });
        }
        await tx.stockMovement.deleteMany({
          where: { purchaseOrderId: { in: orderIds } },
        });
        // Shared catalogue items survive; only their supplier association is removed.
        await tx.item.updateMany({
          where: { mainSupplierId: id },
          data: { mainSupplierId: null },
        });
        // Existing FK cascades remove orders, their lines/history and supplier debts.
        return tx.supplier.delete({ where: { id } });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 30000,
      },
    );
  }
}
