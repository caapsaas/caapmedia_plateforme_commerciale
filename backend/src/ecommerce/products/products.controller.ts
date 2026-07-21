import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { UploadedFiles } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { RoleGuard } from 'src/common/auth/role/role.guard';
import { Roles } from 'src/common/auth/role/role.decorator';
import { UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { extname } from 'path';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';

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
    FilesInterceptor('productImages', 5, {
      storage: diskStorage({
        destination: './public/products',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.CAISSIER,
    UserRole.PURCHASING_MANAGER,
    UserRole.PRODUCTION_DIRECTOR,
    UserRole.FINANCIAL_DIRECTOR,
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
  )
  findAll() {
    return this.productsService.findAll();
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
   * Endpoint pour récupérer un service par son ID
   * Exemple d'URL : /products/:id
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.CAISSIER,
    UserRole.PURCHASING_MANAGER,
    UserRole.PRODUCTION_DIRECTOR,
    UserRole.FINANCIAL_DIRECTOR,
  )
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productsService.findOne(id);
  }

  /**
   * Endpoint pour mettre à jour un service
   * Exemple d'URL : /products/:id
   */
  @Patch(':id')
  @UseInterceptors(
    FilesInterceptor('productImages', 5, {
      storage: diskStorage({
        destination: './public/products',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.CAISSIER,
    UserRole.PURCHASING_MANAGER,
    UserRole.PRODUCTION_DIRECTOR,
    UserRole.FINANCIAL_DIRECTOR,
  )
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
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
  )
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productsService.remove(id);
  }
}
