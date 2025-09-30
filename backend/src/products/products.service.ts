import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) { }

  private includeAll = {
    configurableOptions: {
      include: { item: true },
    },
    productImages: true,
  };

  // Cette fonction convertit ces champs en nombres ou chaînes pour que le JSON renvoyé soit plus simple à manipuler côté client
  private mapDecimals(product: any) {
    if (!product) return null;
    return {
      ...product,
      price: product.price?.toString(),
      sellingPrice: product.sellingPrice?.toString(),
      stock: product.stock?.toString(),
      configurableOptions: product.configurableOptions?.map((co: any) => ({
        ...co,
        item: co.item
          ? { ...co.item, multiplier: co.item.multiplier?.toString() }
          : null,
      })),
    };
  }

  /**
   * 
   * @param createProductDto // DTO contenant les données du produit à créer
   * @returns // Produit créé
   */
  async create(createProductDto: CreateProductDto) {
    const { configurableOptions, productImages, ...productData } = createProductDto;

    // On crée le produit avec ses options configurables et images dans la base de données avec Prisma.
    const product = await this.prisma.product.create({
      data: {
        ...productData,
        configurableOptions: configurableOptions
          ? {
            create: configurableOptions.map((opt) => ({
              optionType: opt.optionType,
              item: {
                connectOrCreate: {
                  where: { optionName: opt.item.optionName },
                  create: opt.item,
                },
              },
            })),
          }
          : undefined,
        productImages: productImages
          ? {
            create: productImages.map((img) => ({
              imageName: img.imageName,
              imageUrl: img.imageUrl,
            })),
          }
          : undefined,
      },
      include: this.includeAll,
    });

    return this.mapDecimals(product);
  }

  /**
   * 
   * @param subsidiaryId // ID de la filiale
   * @returns // Liste des produits de la filiale
   */
  async findAll(subsidiaryId: string) {
    const products = await this.prisma.product.findMany({
      where: { subsidiaryId },
      include: this.includeAll,
    });
    return products.map((p) => this.mapDecimals(p));
  }

  /**
   * 
   * @param id // ID du produit
   * @returns // Produit trouvé
   */
  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: this.includeAll,
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
    return this.mapDecimals(product);
  }

  /**
   * 
   * @param id // ID du produit
   * @param updateProductDto // DTO contenant les données du produit à mettre à jour
   * @returns // Produit mis à jour
   */
  async update(id: string, updateProductDto: UpdateProductDto) {
    const { configurableOptions, productImages, ...productData } =
      updateProductDto;

    // Vérifie que le produit existe
    await this.findOne(id);

    const product = await this.prisma.$transaction(async (tx) => {
      // Mise à jour des infos de base
      await tx.product.update({
        where: { id },
        data: { ...productData },
      });

      // 🔹 Mise à jour des options configurables
      if (configurableOptions) {
        // Supprimer toutes les anciennes options
        await tx.configurableOption.deleteMany({ where: { productId: id } });

        // Recréer chaque option avec connectOrCreate sur l’item
        for (const opt of configurableOptions) {
          // 1️⃣ Créer ou récupérer l'item
          const item = await tx.configurableOptionItem.upsert({
            where: { optionName: opt.item.optionName },
            update: {},
            create: {
              optionName: opt.item.optionName,
              multiplier: opt.item.multiplier,
            },
          });

          // 2️⃣ Créer la ConfigurableOption en utilisant itemId
          await tx.configurableOption.create({
            data: {
              optionType: opt.optionType,
              productId: id,
              itemId: item.id, // <-- on passe l'id ici
            },
          });
        }
      }

      // 🔹 Mise à jour des images
      if (productImages) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        await tx.productImage.createMany({
          data: productImages.map((img) => ({
            imageName: img.imageName,
            imageUrl: img.imageUrl,
            productId: id,
          })),
        });
      }

      // Retourne le produit mis à jour
      return tx.product.findUnique({
        where: { id },
        include: this.includeAll,
      });
    });

    return this.mapDecimals(product);
  }

  /**
   * 
   * @param id // ID du produit
   * @returns // Produit supprimé
   */
  async remove(id: string) {
    await this.findOne(id);
    const deleted = await this.prisma.product.delete({
      where: { id },
    });
    return { id: deleted.id };
  }
}
