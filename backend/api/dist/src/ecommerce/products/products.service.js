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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/utils/prisma/prisma.service");
const client_1 = require("@prisma/client");
const generate_id_util_1 = require("../../common/utils/generate-id.util");
const id_prefixes_const_1 = require("../../common/constants/id-prefixes.const");
const file_upload_const_1 = require("../../common/constants/file-upload.const");
const product_image_storage_1 = require("./product-image-storage");
const pagination_1 = require("../../common/pagination/pagination");
let ProductsService = class ProductsService {
    prisma;
    imageStorage;
    constructor(prisma, imageStorage) {
        this.prisma = prisma;
        this.imageStorage = imageStorage;
    }
    includeAll = {
        productImages: true,
    };
    mapDecimals(product) {
        return product;
    }
    async create(createProductDto, files) {
        const { productImages: _ignored, ...productData } = createProductDto;
        void _ignored;
        const uploaded = await this.imageStorage.upload(files);
        const product = await this.prisma.item.create({
            data: {
                id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.PRODUCT),
                ...productData,
                type: client_1.ItemType.SERVICE,
                productImages: files?.length
                    ? {
                        create: uploaded.map((image) => ({
                            id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.PRODUCTIMAGE),
                            ...image,
                        })),
                    }
                    : undefined,
            },
            include: this.includeAll,
        });
        return this.mapDecimals(product);
    }
    async findAll(paginationQuery = {}) {
        const where = { type: client_1.ItemType.SERVICE };
        if (paginationQuery.search) {
            where.OR = [
                { name: { contains: paginationQuery.search, mode: 'insensitive' } },
                { category: { contains: paginationQuery.search, mode: 'insensitive' } },
            ];
        }
        const result = await (0, pagination_1.paginate)(this.prisma.item, { where, include: this.includeAll }, paginationQuery);
        return {
            ...result,
            data: result.data.map((p) => this.mapDecimals(p)),
        };
    }
    async findMany(page, category) {
        const TAKE = 9;
        const where = {
            type: client_1.ItemType.SERVICE,
            isActive: true,
            isVisibleOnSite: true,
            ...(category ? { category } : {}),
        };
        const products = await this.prisma.item.findMany({
            where,
            skip: (page - 1) * 8,
            take: TAKE,
            include: this.includeAll,
        });
        return products.map((p) => this.mapDecimals(p));
    }
    async searchProducts(query) {
        const products = await this.prisma.item.findMany({
            where: {
                type: client_1.ItemType.SERVICE,
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
    async findPublicShare(id) {
        const product = await this.prisma.item.findFirst({
            where: {
                id,
                type: client_1.ItemType.SERVICE,
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
        if (!product)
            throw new common_1.NotFoundException('Produit indisponible');
        return product;
    }
    async getFavorites(ids) {
        return this.prisma.item.findMany({
            where: {
                id: { in: ids },
                type: client_1.ItemType.SERVICE,
            },
        });
    }
    async findOne(id) {
        const product = await this.prisma.item.findUnique({
            where: { id, type: client_1.ItemType.SERVICE },
            include: this.includeAll,
        });
        if (!product) {
            throw new common_1.NotFoundException(`Service avec l'ID "${id}" non trouvé`);
        }
        return this.mapDecimals(product);
    }
    async update(id, updateProductDto, files) {
        const { productImages, existingImages, ...productData } = updateProductDto;
        void productImages;
        const currentProduct = await this.findOne(id);
        const keptImageUrls = existingImages !== undefined
            ? (Array.isArray(existingImages)
                ? existingImages
                : [existingImages]).filter(Boolean)
            : currentProduct.productImages.map((img) => img.imageUrl);
        if (keptImageUrls.length + (files?.length || 0) >
            file_upload_const_1.FILE_UPLOAD_CONFIG.LIMITS.MAX_FILES_PER_UPLOAD) {
            throw new common_1.BadRequestException(file_upload_const_1.FILE_UPLOAD_CONFIG.ERRORS.TOO_MANY_FILES);
        }
        const imagesToRemove = currentProduct.productImages.filter((img) => !keptImageUrls.includes(img.imageUrl));
        const uploaded = await this.imageStorage.upload(files);
        const product = await this.prisma.$transaction(async (tx) => {
            await tx.item.update({
                where: { id },
                data: productData,
            });
            if (imagesToRemove.length) {
                await tx.productImage.deleteMany({
                    where: { id: { in: imagesToRemove.map((img) => img.id) } },
                });
            }
            if (files?.length) {
                const newImageData = uploaded.map((image) => ({
                    id: (0, generate_id_util_1.generateId)(id_prefixes_const_1.ID_PREFIXES.PRODUCTIMAGE),
                    ...image,
                    productId: id,
                }));
                await tx.productImage.createMany({ data: newImageData });
            }
            return tx.item.findUnique({
                where: { id },
                include: this.includeAll,
            });
        });
        for (const image of imagesToRemove) {
            this.imageStorage.retainDetached(image.imageUrl);
        }
        return this.mapDecimals(product);
    }
    async remove(id) {
        const existingProduct = await this.prisma.item.findUnique({
            where: { id },
            include: { productImages: true },
        });
        if (!existingProduct) {
            throw new common_1.NotFoundException(`Service avec l'ID "${id}" non trouvé`);
        }
        await this.prisma.item.delete({ where: { id } });
        for (const image of existingProduct.productImages) {
            this.imageStorage.retainDetached(image.imageUrl);
        }
        return { success: true, id };
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        product_image_storage_1.ProductImageStorage])
], ProductsService);
//# sourceMappingURL=products.service.js.map