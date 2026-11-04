import type { Request, Response } from 'express';
import { renderProductShare } from './product-share';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { RoleGuard } from 'src/common/auth/role/role.guard';
import { Roles } from 'src/common/auth/role/role.decorator';
import { UserRole } from '@prisma/client';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { FILE_UPLOAD_CONFIG } from 'src/common/constants/file-upload.const';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';

// Catalogue de services (Chantier 1) : donnée globale, pas de scope filiale.
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Endpoint pour créer un nouveau service
   * Exemple d'URL : /products
   */
  @Post()
  @UseInterceptors(
    FilesInterceptor(
      'productImages',
      FILE_UPLOAD_CONFIG.LIMITS.MAX_FILES_PER_UPLOAD,
      {
        storage: memoryStorage(),
        limits: {
          fileSize: FILE_UPLOAD_CONFIG.LIMITS.MAX_FILE_SIZE,
        },
        fileFilter: (req, file, cb) => {
          const isValidMime =
            FILE_UPLOAD_CONFIG.ALLOWED_MIME_TYPES.IMAGES.includes(
              file.mimetype,
            );
          if (!isValidMime) {
            cb(
              new BadRequestException(
                FILE_UPLOAD_CONFIG.ERRORS.INVALID_MIME_TYPE,
              ) as any,
              false,
            );
          } else {
            cb(null, true);
          }
        },
      },
    ),
  )
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.CAISSIER,
    UserRole.PURCHASING_MANAGER,
    UserRole.PRODUCTION_DIRECTOR,
    UserRole.FINANCIAL_DIRECTOR,
    UserRole.SECRETARY,
  )
  create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.productsService.create(createProductDto, files);
  }

  /**
   * Endpoint pour récupérer tous les services du catalogue
   * Exemple d'URL : /products
   */
  @Get()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.CAISSIER,
    UserRole.PURCHASING_MANAGER,
    UserRole.PRODUCTION_DIRECTOR,
    UserRole.FINANCIAL_DIRECTOR,
    UserRole.SECRETARY,
  )
  findAll(@Query() paginationQuery: PaginationQueryDto) {
    return this.productsService.findAll(paginationQuery);
  }

  /**
   * Endpoint public pour le catalogue du site vitrine (pagination)
   * Exemple d'URL : /products/get-all-products?page=1&category=Flyers
   */
  @Get('get-all-products')
  findAllProducts(
    @Query('page') page: string,
    @Query('category') category?: string,
  ) {
    const pageNumber = parseInt(page) || 1;
    return this.productsService.findMany(pageNumber, category);
  }

  @Get('search-products')
  searchProducts(@Query('query') query: string) {
    return this.productsService.searchProducts(query);
  }

  @Post('favorites')
  getFavorites(@Body() body: { ids: string[] }) {
    return this.productsService.getFavorites(body.ids);
  }

  /**
   * Page publique avec métadonnées lisibles par les robots WhatsApp.
   */
  @Get(':id/share')
  async share(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const product = await this.productsService.findPublicShare(id);
    const origin =
      process.env.PUBLIC_BACKEND_URL || req.protocol + '://' + req.get('host');
    return res
      .type('html')
      .set({
        'Cache-Control': 'public, max-age=60',
        'Content-Security-Policy':
          "default-src 'none'; img-src https: http:; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
        'Referrer-Policy': 'no-referrer',
      })
      .send(renderProductShare(product, origin));
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.CAISSIER,
    UserRole.PURCHASING_MANAGER,
    UserRole.PRODUCTION_DIRECTOR,
    UserRole.FINANCIAL_DIRECTOR,
    UserRole.SECRETARY,
  )
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  /**
   * Endpoint pour mettre à jour un service
   * Exemple d'URL : /products/:id
   */
  @Patch(':id')
  @UseInterceptors(
    FilesInterceptor(
      'productImages',
      FILE_UPLOAD_CONFIG.LIMITS.MAX_FILES_PER_UPLOAD,
      {
        storage: memoryStorage(),
        limits: {
          fileSize: FILE_UPLOAD_CONFIG.LIMITS.MAX_FILE_SIZE,
        },
        fileFilter: (req, file, cb) => {
          const isValidMime =
            FILE_UPLOAD_CONFIG.ALLOWED_MIME_TYPES.IMAGES.includes(
              file.mimetype,
            );
          if (!isValidMime) {
            cb(
              new BadRequestException(
                FILE_UPLOAD_CONFIG.ERRORS.INVALID_MIME_TYPE,
              ) as any,
              false,
            );
          } else {
            cb(null, true);
          }
        },
      },
    ),
  )
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.CAISSIER,
    UserRole.PURCHASING_MANAGER,
    UserRole.PRODUCTION_DIRECTOR,
    UserRole.FINANCIAL_DIRECTOR,
    UserRole.SECRETARY,
  )
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.productsService.update(id, updateProductDto, files);
  }

  /**
   * Endpoint pour supprimer un service
   * Exemple d'URL : /products/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.CAISSIER,
    UserRole.PURCHASING_MANAGER,
    UserRole.PRODUCTION_DIRECTOR,
    UserRole.FINANCIAL_DIRECTOR,
    UserRole.SECRETARY,
  )
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
