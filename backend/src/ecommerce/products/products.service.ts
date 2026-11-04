import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { ItemType } from '@prisma/client';
import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';
import { FILE_UPLOAD_CONFIG } from 'src/common/constants/file-upload.const';
import { ProductImageStorage } from './product-image-storage';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';
import { paginate } from 'src/common/pagination/pagination';
import type { Prisma } from '@prisma/client';

// Catalogue de services (Chantier 1) : donnée globale, sans prix ni stock.
// Le CRUD des produits de stock (matières premières, scopé filiale) vit dans
// purchase/stock-items — ce service ne gère plus que les Item de type SERVICE.
@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly imageStorage: ProductImageStorage,
  ) {}

  private includeAll = {
    productImages: true,
  };

  // Cette fonction convertit ces champs en nombres ou chaînes pour que le JSON renvoyé soit plus simple à manipuler côté client
  private mapDecimals(
    product: Prisma.ItemGetPayload<{ include: { productImages: true } }> | null,
  ) {
    return product;
  }

  /**
   *
   * @param createProductDto // DTO contenant les données du service à créer
   * @param files // Fichiers uploadés
   * @returns // Service créé
   */
  async create(
    createProductDto: CreateProductDto,
    files: Express.Multer.File[],
  ) {
    const { productImages: _ignored, ...productData } = createProductDto;
    void _ignored;
    const uploaded = await this.imageStorage.upload(files);
    const product = await this.prisma.item.create({
      data: {
        id: generateId(ID_PREFIXES.PRODUCT),
        ...productData,
        type: ItemType.SERVICE,
        productImages: files?.length
          ? {
              create: uploaded.map((image) => ({
                id: generateId(ID_PREFIXES.PRODUCTIMAGE),
                ...image,
              })),
            }
          : undefined,
      },
      include: this.includeAll,
    });

    return this.mapDecimals(product);
  }

  /**
   * @returns // Liste de tous les services du catalogue (donnée globale), paginée
   */
  async findAll(paginationQuery: PaginationQueryDto = {}) {
    const where: Prisma.ItemWhereInput = { type: ItemType.SERVICE };
    if (paginationQuery.search) {
      where.OR = [
        { name: { contains: paginationQuery.search, mode: 'insensitive' } },
        { category: { contains: paginationQuery.search, mode: 'insensitive' } },
      ];
    }

    type ProductWithImages = Prisma.ItemGetPayload<{
      include: { productImages: true };
    }>;
    const result = await paginate<ProductWithImages>(
      // Cast nécessaire : le délégué Prisma généré a des surcharges de
      // findMany() par forme d'`include` que l'interface générique
      // PaginatableModel<T> ne peut pas unifier structurellement.
      this.prisma.item as unknown as Parameters<
        typeof paginate<ProductWithImages>
      >[0],
      { where, include: this.includeAll },
      paginationQuery,
    );

    return {
      ...result,
      data: result.data.map((p) => this.mapDecimals(p)),
    };
  }

  async findMany(page: number, category?: string) {
    const TAKE = 9; // on prend 9 pour détecter s'il y a une suite
    const where = {
      type: ItemType.SERVICE,
      isActive: true,
      isVisibleOnSite: true,
      ...(category ? { category } : {}),
    };

    const products = await this.prisma.item.findMany({
      where,
      skip: (page - 1) * 8, // on saute par 8
      take: TAKE,
      include: this.includeAll,
    });
    return products.map((p) => this.mapDecimals(p));
  }

  async searchProducts(query: string) {
    const products = await this.prisma.item.findMany({
      where: {
        type: ItemType.SERVICE,
        isActive: true,
        isVisibleOnSite: true,
        OR: [
          { category: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 8,
      include: this.includeAll,
    });
    return products.map((p) => this.mapDecimals(p));
  }

  async findPublicShare(id: string) {
    const product = await this.prisma.item.findFirst({
      where: {
        id,
        type: ItemType.SERVICE,
        isActive: true,
        isVisibleOnSite: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        productImages: {
          select: { id: true, imageUrl: true },
          orderBy: { id: 'asc' },
        },
      },
    });
    if (!product) throw new NotFoundException('Produit indisponible');
    return product;
  }

  async getFavorites(ids: string[]) {
    return this.prisma.item.findMany({
      where: {
        id: { in: ids },
        type: ItemType.SERVICE,
      },
    });
  }

  /**
   *
   * @param id // ID du service
   * @returns // Service trouvé
   */
  async findOne(id: string) {
    const product = await this.prisma.item.findUnique({
      where: { id, type: ItemType.SERVICE },
      include: this.includeAll,
    });

    if (!product) {
      throw new NotFoundException(`Service avec l'ID "${id}" non trouvé`);
    }
    return this.mapDecimals(product);
  }

  /**
   *
   * @param id // ID du service
   * @param updateProductDto // DTO contenant les données du service à mettre à jour
   * @param files // Fichiers uploadés
   * @returns // Service mis à jour
   */
  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    files: Express.Multer.File[],
  ) {
    const { productImages, existingImages, ...productData } = updateProductDto;
    void productImages;

    // Vérifie que le service existe
    const currentProduct = await this.findOne(id);

    // URLs des images existantes à conserver. Si le champ n'est pas fourni,
    // on ne touche à aucune image existante (compatibilité avec un appelant
    // qui n'enverrait que des champs texte).
    const keptImageUrls =
      existingImages !== undefined
        ? (Array.isArray(existingImages)
            ? existingImages
            : [existingImages]
          ).filter(Boolean)
        : (currentProduct.productImages as { imageUrl: string }[]).map(
            (img) => img.imageUrl,
          );

    if (
      keptImageUrls.length + (files?.length || 0) >
      FILE_UPLOAD_CONFIG.LIMITS.MAX_FILES_PER_UPLOAD
    ) {
      throw new BadRequestException(FILE_UPLOAD_CONFIG.ERRORS.TOO_MANY_FILES);
    }

    const imagesToRemove = (
      currentProduct.productImages as { id: string; imageUrl: string }[]
    ).filter((img) => !keptImageUrls.includes(img.imageUrl));

    const uploaded = await this.imageStorage.upload(files);
    const product = await this.prisma.$transaction(async (tx) => {
      // Mise à jour des infos de base
      await tx.item.update({
        where: { id },
        data: productData,
      });

      // Supprime uniquement les images retirées par l'utilisateur
      if (imagesToRemove.length) {
        await tx.productImage.deleteMany({
          where: { id: { in: imagesToRemove.map((img) => img.id) } },
        });
      }

      // Ajoute les nouvelles images sans toucher à celles conservées
      if (files?.length) {
        const newImageData = uploaded.map((image) => ({
          id: generateId(ID_PREFIXES.PRODUCTIMAGE),
          ...image,
          productId: id,
        }));

        await tx.productImage.createMany({ data: newImageData });
      }

      // Retourne le service mis à jour
      return tx.item.findUnique({
        where: { id },
        include: this.includeAll,
      });
    });

    // Conserve les originaux pour les liens publics déjà partagés.
    for (const image of imagesToRemove) {
      this.imageStorage.retainDetached(image.imageUrl);
    }

    return this.mapDecimals(product);
  }

  /**
   *
   * @param id // ID du service
   * @returns // Service supprimé
   */
  async remove(id: string) {
    // Vérifie que le service existe et récupère les images à supprimer
    const existingProduct = await this.prisma.item.findUnique({
      where: { id },
      include: { productImages: true },
    });
    if (!existingProduct) {
      throw new NotFoundException(`Service avec l'ID "${id}" non trouvé`);
    }

    await this.prisma.item.delete({ where: { id } });

    // Conserve les originaux après suppression en base.
    for (const image of existingProduct.productImages) {
      this.imageStorage.retainDetached(image.imageUrl);
    }

    return { success: true, id };
  }
}
