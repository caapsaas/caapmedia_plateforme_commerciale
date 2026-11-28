import {
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import {
  CreateSupplierDto,
  UpdateSupplierDto,
} from './dto/create-supplier.dto';
import { Prisma } from '@prisma/client';
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
import { SystemAuditService } from 'src/common/audit/system-audit.service';

type AuditActor = ScopableUser & {
  id?: string;
  email?: string;
};

@Injectable()
export class SuppliersService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly systemAudit?: SystemAuditService,
  ) {}

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
    includeArchived = false,
  ): Promise<PaginatedResult<Supplier>> {
    const ctx = resolveScopeContext(user);
    const where: Prisma.SupplierWhereInput = withSubsidiaryScope(
      includeArchived ? {} : { isActive: true },
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
   * Methode d'archivage / suppression non destructive d'un fournisseur (Lot 1).
   * - S'il possede des commandes d'achat ou articles lies, il est archive
   *   (`isActive = false`) pour preserver la piste d'audit et les stocks.
   * - S'il est vierge (aucun historique), il peut etre supprime physiquement.
   */
  async remove(id: string, user: AuditActor) {
    const result = await this.prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.findUnique({ where: { id } });
      if (!supplier) {
        throw new NotFoundException(
          `Fournisseur avec l'ID "${id}" non trouvé.`,
        );
      }
      assertSubsidiaryAccess(supplier.subsidiaryId, resolveScopeContext(user));

      const [orderCount, itemCount] = await Promise.all([
        tx.purchaseOrder.count({ where: { supplierId: id } }),
        tx.item.count({ where: { mainSupplierId: id } }),
      ]);

      if (orderCount > 0 || itemCount > 0) {
        const archived = await tx.supplier.update({
          where: { id },
          data: {
            isActive: false,
            archivedAt: new Date(),
            archivedBy: user.id ?? null,
          },
        });
        await this.systemAudit?.log(
          {
            actorId: user.id ?? null,
            actorEmail: user.email ?? null,
            actorRole: user.activeRole ?? user.role ?? null,
            subsidiaryId: supplier.subsidiaryId,
            action: 'SUPPLIER_ARCHIVED',
            entityType: 'Supplier',
            entityId: id,
            summary: `Fournisseur ${supplier.supplierName} archivé (${orderCount} BC, ${itemCount} article(s) liés)`,
            metadata: { orderCount, itemCount },
          },
          tx,
        );
        return { ...archived, archived: true };
      }

      const deleted = await tx.supplier.delete({ where: { id } });
      await this.systemAudit?.log(
        {
          actorId: user.id ?? null,
          actorEmail: user.email ?? null,
          actorRole: user.activeRole ?? user.role ?? null,
          subsidiaryId: supplier.subsidiaryId,
          action: 'SUPPLIER_DELETED',
          entityType: 'Supplier',
          entityId: id,
          summary: `Fournisseur vierge ${supplier.supplierName} supprimé`,
        },
        tx,
      );
      return { ...deleted, archived: false };
    });

    return result;
  }

  async restore(id: string, user: AuditActor) {
    const supplier = await this.findOne(id, user);
    const restored = await this.prisma.supplier.update({
      where: { id },
      data: {
        isActive: true,
        archivedAt: null,
        archivedBy: null,
      },
    });
    await this.systemAudit?.log({
      actorId: user.id ?? null,
      actorEmail: user.email ?? null,
      actorRole: user.activeRole ?? user.role ?? null,
      subsidiaryId: supplier.subsidiaryId,
      action: 'SUPPLIER_RESTORED',
      entityType: 'Supplier',
      entityId: id,
      summary: `Fournisseur ${supplier.supplierName} réactivé`,
    });
    return restored;
  }
}
