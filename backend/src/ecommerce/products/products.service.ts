import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { ItemType } from '@prisma/client';

// Catalogue de services (Chantier 1) : donnée globale, sans prix ni stock.
// Le CRUD des produits de stock (matières premières, scopé filiale) vit dans
// purchase/stock-items — ce service ne gère plus que les Item de type SERVICE.
@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private includeAll = {
    productImages: true,
  };

  // Cette fonction convertit ces champs en nombres ou chaînes pour que le JSON renvoyé soit plus simple à manipuler côté client
  private mapDecimals(product: any) {
    if (!product) return null;

    return {
      ...product,
      productImages: product.productImages,
    };
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
    const product = await this.prisma.item.create({
      data: {
        ...createProductDto,
        type: ItemType.SERVICE,
        productImages: files?.length
          ? {
              create: files.map((file) => ({
                imageName: file.originalname,
                imageUrl: `/public/products/${file.filename}`,
              })),
            }
          : undefined,
      },
      include: this.includeAll,
    });

    return this.mapDecimals(product);
  }

  /**
   * @returns // Liste de tous les services du catalogue (donnée globale)
   */
  async findAll() {
    const products = await this.prisma.item.findMany({
      where: { type: ItemType.SERVICE },
      include: this.includeAll,
    });
    return products.map((p) => this.mapDecimals(p));
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
    const { productImages, ...productData } = updateProductDto;

    // Vérifie que le service existe
    await this.findOne(id);

    const product = await this.prisma.$transaction(async (tx) => {
      // Mise à jour des infos de base
      await tx.item.update({
        where: { id },
        data: productData,
      });

      // Mise à jour des images
      if (files?.length) {
        await tx.productImage.deleteMany({ where: { productId: id } });

        await tx.productImage.createMany({
          data: files.map((file) => ({
            imageName: file.originalname,
            imageUrl: `/public/products/${file.filename}`,
            productId: id,
          })),
        });
      }

      // Retourne le service mis à jour
      return tx.item.findUnique({
        where: { id },
        include: this.includeAll,
      });
    });

    return this.mapDecimals(product);
  }

  /**
   *
   * @param id // ID du service
   * @returns // Service supprimé
   */
  async remove(id: string) {
    // Vérifie que le service existe
    await this.findOne(id);
    const deleted = await this.prisma.item.delete({
      where: { id },
    });
    return { id: deleted.id };
  }
}
