import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';

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
   * @param user // Utilisateur connecté
   * @param files // Fichiers uploadés
   * @returns // Produit créé
   */
  async create(createProductDto: CreateProductDto, user: any, files: Express.Multer.File[]) {
    const { configurableOptions, ...productData } = createProductDto;

    const product = await this.prisma.product.create({
      data: {
        ...productData,
        stock: Number(productData.stock),
        price: Number(productData.price),
        sellingPrice: Number(productData.sellingPrice),
        subsidiaryId: user.subsidiaryId,
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
        productImages: files?.length
          ? {
            create: files.map((file) => ({
              imageName: file.originalname,
              imageUrl: `/api-caapsaas/products/${file.filename}`,
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
  async findAll(user: any) {
    const products = await this.prisma.product.findMany({
      where: { subsidiaryId: user.subsidiaryId },
      include: this.includeAll,
    });
    return products.map((p) => this.mapDecimals(p));
  }

  /**
   * 
   * @param id // ID du produit
   * @returns // Produit trouvé
   */
  async findOne(id: string, user: any) {
    const product = await this.prisma.product.findUnique({
      where: { id, subsidiaryId: user.subsidiaryId },
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
   * @param user // Utilisateur connecté
   * @param files // Fichiers uploadés
   * @returns // Produit mis à jour
   */
  async update(id: string, updateProductDto: UpdateProductDto, user: any, files: Express.Multer.File[]) {
    const { configurableOptions, productImages, ...productData } =
      updateProductDto;

    // Vérifie que le produit existe
    await this.findOne(id, user);

    const dataToUpdate: any = { ...productData };

    // Convertir les champs numériques de string à number s'ils sont présents
    if (productData.stock !== undefined) {
      dataToUpdate.stock = Number(productData.stock);
    }
    if (productData.price !== undefined) {
      dataToUpdate.price = Number(productData.price);
    }
    if (productData.sellingPrice !== undefined) {
      dataToUpdate.sellingPrice = Number(productData.sellingPrice);
    }

    const product = await this.prisma.$transaction(async (tx) => {
      // Mise à jour des infos de base
      await tx.product.update({
        where: { id, subsidiaryId: user.subsidiaryId },
        data: { ...dataToUpdate, subsidiaryId: user.subsidiaryId },
      });

      // Mise à jour des options configurables
      if (configurableOptions) {
        // Supprimer toutes les anciennes options
        await tx.configurableOption.deleteMany({ where: { productId: id } });

        // Recréer chaque option avec connectOrCreate sur l’item
        for (const opt of configurableOptions) {
          // Créer ou récupérer l'item
          const item = await tx.configurableOptionItem.upsert({
            where: { optionName: opt.item.optionName },
            update: {},
            create: {
              optionName: opt.item.optionName,
              multiplier: opt.item.multiplier,
            },
          });

          // Créer la ConfigurableOption en utilisant itemId
          await tx.configurableOption.create({
            data: {
              optionType: opt.optionType,
              productId: id,
              itemId: item.id, // <-- on passe l'id ici
            },
          });
        }
      }

      // Mise à jour des images
      if (files?.length) {
        await tx.productImage.deleteMany({ where: { productId: id } });

        await tx.productImage.createMany({
          data: files.map((file) => ({
            imageName: file.originalname,
            imageUrl: `/api-caapsaas/products/${file.filename}`,
            productId: id,
          })),
        });
      }

      // Retourne le produit mis à jour
      return tx.product.findUnique({
        where: { id, subsidiaryId: user.subsidiaryId },
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
  async remove(id: string, user: any) {
    // Vérifie que le produit existe
    await this.findOne(id, user);
    const deleted = await this.prisma.product.delete({
      where: { id, subsidiaryId: user.subsidiaryId },
    });
    return { id: deleted.id };
  }
}
