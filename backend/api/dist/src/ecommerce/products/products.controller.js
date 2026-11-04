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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsController = void 0;
const product_share_1 = require("./product-share");
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const products_service_1 = require("./products.service");
const jwt_guard_1 = require("../../common/auth/jwt/jwt.guard");
const role_guard_1 = require("../../common/auth/role/role.guard");
const role_decorator_1 = require("../../common/auth/role/role.decorator");
const client_1 = require("@prisma/client");
const create_product_dto_1 = require("./dto/create-product.dto");
const file_upload_const_1 = require("../../common/constants/file-upload.const");
const pagination_query_dto_1 = require("../../common/pagination/dto/pagination-query.dto");
let ProductsController = class ProductsController {
    productsService;
    constructor(productsService) {
        this.productsService = productsService;
    }
    create(createProductDto, files) {
        return this.productsService.create(createProductDto, files);
    }
    findAll(paginationQuery) {
        return this.productsService.findAll(paginationQuery);
    }
    findAllProducts(page, category) {
        const pageNumber = parseInt(page) || 1;
        return this.productsService.findMany(pageNumber, category);
    }
    searchProducts(query) {
        return this.productsService.searchProducts(query);
    }
    getFavorites(body) {
        return this.productsService.getFavorites(body.ids);
    }
    async share(id, req, res) {
        const product = await this.productsService.findPublicShare(id);
        const origin = process.env.PUBLIC_BACKEND_URL || req.protocol + '://' + req.get('host');
        return res
            .type('html')
            .set({
            'Cache-Control': 'public, max-age=60',
            'Content-Security-Policy': "default-src 'none'; img-src https: http:; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
            'Referrer-Policy': 'no-referrer',
        })
            .send((0, product_share_1.renderProductShare)(product, origin));
    }
    findOne(id) {
        return this.productsService.findOne(id);
    }
    update(id, updateProductDto, files) {
        return this.productsService.update(id, updateProductDto, files);
    }
    remove(id) {
        return this.productsService.remove(id);
    }
};
exports.ProductsController = ProductsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('productImages', file_upload_const_1.FILE_UPLOAD_CONFIG.LIMITS.MAX_FILES_PER_UPLOAD, {
        storage: (0, multer_1.memoryStorage)(),
        limits: {
            fileSize: file_upload_const_1.FILE_UPLOAD_CONFIG.LIMITS.MAX_FILE_SIZE,
        },
        fileFilter: (req, file, cb) => {
            const isValidMime = file_upload_const_1.FILE_UPLOAD_CONFIG.ALLOWED_MIME_TYPES.IMAGES.includes(file.mimetype);
            if (!isValidMime) {
                cb(new common_1.BadRequestException(file_upload_const_1.FILE_UPLOAD_CONFIG.ERRORS.INVALID_MIME_TYPE), false);
            }
            else {
                cb(null, true);
            }
        },
    })),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.CAISSIER, client_1.UserRole.PURCHASING_MANAGER, client_1.UserRole.PRODUCTION_DIRECTOR, client_1.UserRole.FINANCIAL_DIRECTOR, client_1.UserRole.SECRETARY),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_product_dto_1.CreateProductDto, Array]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.CAISSIER, client_1.UserRole.PURCHASING_MANAGER, client_1.UserRole.PRODUCTION_DIRECTOR, client_1.UserRole.FINANCIAL_DIRECTOR, client_1.UserRole.SECRETARY),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('get-all-products'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "findAllProducts", null);
__decorate([
    (0, common_1.Get)('search-products'),
    __param(0, (0, common_1.Query)('query')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "searchProducts", null);
__decorate([
    (0, common_1.Post)('favorites'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "getFavorites", null);
__decorate([
    (0, common_1.Get)(':id/share'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "share", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.CAISSIER, client_1.UserRole.PURCHASING_MANAGER, client_1.UserRole.PRODUCTION_DIRECTOR, client_1.UserRole.FINANCIAL_DIRECTOR, client_1.UserRole.SECRETARY),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('productImages', file_upload_const_1.FILE_UPLOAD_CONFIG.LIMITS.MAX_FILES_PER_UPLOAD, {
        storage: (0, multer_1.memoryStorage)(),
        limits: {
            fileSize: file_upload_const_1.FILE_UPLOAD_CONFIG.LIMITS.MAX_FILE_SIZE,
        },
        fileFilter: (req, file, cb) => {
            const isValidMime = file_upload_const_1.FILE_UPLOAD_CONFIG.ALLOWED_MIME_TYPES.IMAGES.includes(file.mimetype);
            if (!isValidMime) {
                cb(new common_1.BadRequestException(file_upload_const_1.FILE_UPLOAD_CONFIG.ERRORS.INVALID_MIME_TYPE), false);
            }
            else {
                cb(null, true);
            }
        },
    })),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.CAISSIER, client_1.UserRole.PURCHASING_MANAGER, client_1.UserRole.PRODUCTION_DIRECTOR, client_1.UserRole.FINANCIAL_DIRECTOR, client_1.UserRole.SECRETARY),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_product_dto_1.UpdateProductDto, Array]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, role_guard_1.RoleGuard),
    (0, role_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.COMMERCIAL, client_1.UserRole.CAISSIER, client_1.UserRole.PURCHASING_MANAGER, client_1.UserRole.PRODUCTION_DIRECTOR, client_1.UserRole.FINANCIAL_DIRECTOR, client_1.UserRole.SECRETARY),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "remove", null);
exports.ProductsController = ProductsController = __decorate([
    (0, common_1.Controller)('products'),
    __metadata("design:paramtypes", [products_service_1.ProductsService])
], ProductsController);
//# sourceMappingURL=products.controller.js.map