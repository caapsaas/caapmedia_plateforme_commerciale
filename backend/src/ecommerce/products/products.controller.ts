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
  Req,
} from '@nestjs/common';
import { UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { UploadedFiles } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { RoleGuard } from 'src/common/auth/role/role.guard';
import { UseGuards } from '@nestjs/common';
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { extname } from 'path';
import {
  CreateProductDto,
  UpdateProductDto,
} from './dto/create-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Endpoint pour créer un nouveau produit
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
  @SetMetadata('roles', [
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.CAISSIER,
    UserRole.PURCHASING_MANAGER,
    UserRole.PRODUCTION_DIRECTOR,
    UserRole.FINANCIAL_DIRECTOR,
  ])
  create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    return this.productsService.create(createProductDto, req.user, files);
  }

  /**
   * Endpoint pour récupérer tous les produits d'une filiale
   * Exemple d'URL : /products/get-all-products?subsidiaryId=123e4567-e89b-12d3-a456-426614174000
   */
  @Get()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.CAISSIER,
    UserRole.PURCHASING_MANAGER,
    UserRole.PRODUCTION_DIRECTOR,
    UserRole.FINANCIAL_DIRECTOR,
  ])
  findAll(@Req() req: any) {
    return this.productsService.findAll(req.user);
  }

  /**
   * Endpoint pour récupérer tous les produits
   * Exemple d'URL : /products/get-all-products
   */
  @Get('get-all-products')
  findAllProducts(
    @Query('page') page: string,
    @Query('mainCategory') mainCategory?: string,
    @Query('category') category?: string,
  ) {
    const pageNumber = parseInt(page) || 1;
    return this.productsService.findMany(pageNumber, mainCategory, category);
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
   * Endpoint pour récupérer un produit par son ID
   * Exemple d'URL : /products/:id
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.CAISSIER,
    UserRole.PURCHASING_MANAGER,
    UserRole.PRODUCTION_DIRECTOR,
    UserRole.FINANCIAL_DIRECTOR,
  ])
  findOne(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: any) {
    return this.productsService.findOne(id, req.user);
  }

  /**
   * Endpoint pour mettre à jour un produit
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
  @SetMetadata('roles', [
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.CAISSIER,
    UserRole.PURCHASING_MANAGER,
    UserRole.PRODUCTION_DIRECTOR,
    UserRole.FINANCIAL_DIRECTOR,
  ])
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    return this.productsService.update(id, updateProductDto, req.user, files);
  }

  /**
   * Endpoint pour supprimer un produit
   * Exemple d'URL : /products/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.CAISSIER,
    UserRole.PURCHASING_MANAGER,
    UserRole.PRODUCTION_DIRECTOR,
    UserRole.FINANCIAL_DIRECTOR,
  ])
  remove(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: any) {
    return this.productsService.remove(id, req.user);
  }
}
function query(
  arg0: string,
): (
  target: ProductsController,
  propertyKey: 'findAllProducts',
  parameterIndex: 0,
) => void {
  throw new Error('Function not implemented.');
}
