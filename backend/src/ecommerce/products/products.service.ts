import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import {
  CreateProductDto,
  UpdateProductDto,
} from './dto/create-product.dto';
import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';
import {
  buildRelativeImagePath,
  deleteImageFile,
} from 'src/common/utils/image.util';
import { FILE_UPLOAD_CONFIG } from 'src/common/constants/file-upload.const';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private includeAll = {
    configurableOptions: {
      include: { item: true },
    },
    productImages: true,
  };

  // Cette fonction convertit ces champs en nombres ou chaînes pour que le JSON renvoyé soit plus simple à manipuler côté client
  private mapDecimals(product: any) {
    if (!product) return null;

    // Regrouper configurableOptions par optionType
    const groupedOptions =
      product.configurableOptions?.reduce((acc: any, co: any) => {
        const type = co.optionType || 'Autre';
        if (!acc[type]) acc[type] = [];

        if (co.item) {
          acc[type].push({
            ...co.item,
            multiplier: co.item.multiplier?.toString(),
          });
        }

        return acc;
      }, {}) || {};

    return {
      ...product,
      productImages: product.productImages,
      stock: product.stock?.toString(),
      configurableOptions: groupedOptions,
    };
  }

  /**
   *
   * @param createProductDto // DTO contenant les données du produit à créer
   * @param user // Utilisateur connecté
   * @param files // Fichiers uploadés
   * @returns // Produit créé
   */
  async create(
    createProductDto: CreateProductDto,
    user: any,
    files: Express.Multer.File[],
  ) {
    const { configurableOptions, ...productData } = createProductDto;

    // Construire les chemins relatifs sécurisés
    const productImageData = files?.map((file) => ({
      id: generateId(ID_PREFIXES.PRODUCTIMAGE),
      imageName: file.originalname,
      imageUrl: buildRelativeImagePath(
        FILE_UPLOAD_CONFIG.UPLOAD_DIRS.PRODUCTS,
        file.filename,
      ),
    })) || [];

    const product = await this.prisma.product.create({
      data: {
        id: generateId(ID_PREFIXES.PRODUCT),
        ...productData,
        stock: Number(productData.stock),
        subsidiaryId: user.subsidiaryId,
        configurableOptions: configurableOptions
          ? {
              create: configurableOptions.map((opt) => ({
                id: generateId(ID_PREFIXES.CONFIGURABLEOPTION),
                optionType: opt.optionType,
                item: {
                  connectOrCreate: {
                    where: { optionName: opt.item.optionName },
                    create: {
                      id: generateId(ID_PREFIXES.CONFIGURABLEOPTIONITEM),
                      optionName: opt.item.optionName,
                      multiplier: Number(opt.item.multiplier),
                    },
                  },
                },
              })),
            }
          : undefined,
        productImages: productImageData.length
          ? {
              create: productImageData,
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
   * @returns // Liste des produits
   */
  // Catégories visibles sur la boutique en ligne (Matières Premières exclues)
  private readonly ECOMMERCE_MAIN_CATEGORIES = [
    'Imprimerie',
    'Signalétique & Display',
    'Objets publicitaires',
    'Prestations de services',
  ];

  async findMany(page: number, mainCategory?: string, category?: string) {
    const TAKE = 9; // on prend 9 pour détecter s'il y a une suite
    const where = category
      ? { category }
      : mainCategory
        ? { mainCategory }
        : { mainCategory: { in: this.ECOMMERCE_MAIN_CATEGORIES } };

    const products = await this.prisma.product.findMany({
      where,
      skip: (page - 1) * 8, // on saute par 8
      take: TAKE,
      include: this.includeAll,
    });
    return products.map((p) => this.mapDecimals(p));
  }

  async searchProducts(query: string) {
    const products = await this.prisma.product.findMany({
      where: {
        mainCategory: { in: this.ECOMMERCE_MAIN_CATEGORIES },
        OR: [
          { category: { contains: query, mode: 'insensitive' } },
          { productName: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 8,
      include: this.includeAll,
    });
    return products.map((p) => this.mapDecimals(p));
  }

  async getFavorites(ids: string[]) {
    return this.prisma.product.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
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
  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    user: any,
    files: Express.Multer.File[],
  ) {
    const { configurableOptions, productImages, ...productData } =
      updateProductDto;

    // Vérifie que le produit existe
    await this.findOne(id, user);

    const dataToUpdate: any = { ...productData };

    if (productData.stock !== undefined) {
      dataToUpdate.stock = Number(productData.stock);
    }

    // Récupérer les anciennes images pour cleanup
    let oldImages: any[] = [];
    if (files?.length) {
      const product = await this.prisma.product.findUnique({
        where: { id },
        include: { productImages: true },
      });
      oldImages = product?.productImages || [];
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
          // Créer ou récupérer l’item
          const item = await tx.configurableOptionItem.upsert({
            where: { optionName: opt.item.optionName },
            update: {},
            create: {
              id: generateId(ID_PREFIXES.CONFIGURABLEOPTIONITEM),
              optionName: opt.item.optionName,
              multiplier: Number(opt.item.multiplier),
            },
          });

          // Créer la ConfigurableOption en utilisant itemId
          await tx.configurableOption.create({
            data: {
              id: generateId(ID_PREFIXES.CONFIGURABLEOPTION),
              optionType: opt.optionType,
              productId: id,
              itemId: item.id,
            },
          });
        }
      }

      // Mise à jour des images
      if (files?.length) {
        await tx.productImage.deleteMany({ where: { productId: id } });

        const newImageData = files.map((file) => ({
          id: generateId(ID_PREFIXES.PRODUCTIMAGE),
          imageName: file.originalname,
          imageUrl: buildRelativeImagePath(
            FILE_UPLOAD_CONFIG.UPLOAD_DIRS.PRODUCTS,
            file.filename,
          ),
          productId: id,
        }));

        await tx.productImage.createMany({ data: newImageData });
      }

      // Retourne le produit mis à jour
      return tx.product.findUnique({
        where: { id, subsidiaryId: user.subsidiaryId },
        include: this.includeAll,
      });
    });

    // Cleanup des anciennes images après succès de la transaction
    if (files?.length) {
      for (const image of oldImages) {
        await deleteImageFile(image.imageUrl);
      }
    }

    return this.mapDecimals(product);
  }

  /**
   * Supprimer un produit + cleanup des images physiques
   * @param id // ID du produit
   * @returns // Confirmation suppression
   */
  async remove(id: string, user: any) {
    // Vérifie que le produit existe et appartient à la filiale
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { productImages: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    if (product.subsidiaryId !== user.subsidiaryId) {
      throw new NotFoundException('Product not found in your subsidiary');
    }

    // Supprimer en BD (cascade supprime productImages)
    await this.prisma.product.delete({
      where: { id, subsidiaryId: user.subsidiaryId },
    });

    // Cleanup des fichiers physiques après suppression en BD
    for (const image of product.productImages) {
      await deleteImageFile(image.imageUrl);
    }

    return { success: true, id };
  }
}
