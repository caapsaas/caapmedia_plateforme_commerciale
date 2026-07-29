import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import {
  CreateSupplierDto,
  UpdateSupplierDto,
} from './dto/create-supplier.dto';
import { User } from '@prisma/client';
import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';
import {
  resolveScopeContext,
  withSubsidiaryScope,
  assertSubsidiaryAccess,
} from 'src/common/utils/subsidiary-scope';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Methode pour creer un fournisseur
   * @param createSupplierDto Dto contenant les donnees pour creation d'un fournisseur
   * @param user Utilisateur connecte
   * @returns Un fournisseur Cree
   */
  async create(createSupplierDto: CreateSupplierDto, user: User) {
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
  async findAll(user: User, subsidiaryId?: string) {
    const ctx = resolveScopeContext(user);
    return this.prisma.supplier.findMany({
      where: withSubsidiaryScope({}, ctx, subsidiaryId),
      orderBy: { supplierName: 'asc' },
    });
  }

  /**
   * Methode pour recuperer un fournisseur
   * @param id ID du fournisseur
   * @param user Utilisateur connecte
   * @returns Un fournisseur
   */
  async findOne(id: string, user: User) {
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
  async update(id: string, updateSupplierDto: UpdateSupplierDto, user: User) {
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
  async remove(id: string, user: User) {
    await this.findOne(id, user);
    return this.prisma.supplier.delete({ where: { id } });
  }
}
