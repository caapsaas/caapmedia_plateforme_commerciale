import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { RoleGuard } from 'src/common/auth/role/role.guard';
import { UseGuards } from '@nestjs/common';
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  /**
   * Endpoint pour créer un nouveau produit
   * Exemple d'URL : /products/add-product
   */
  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [UserRole.ADMIN])
  create(@Body() createProductDto: CreateProductDto, @Req() req: any) {
    return this.productsService.create(createProductDto, req.user);
  }

  /**
   * Endpoint pour récupérer tous les produits d'une filiale
   * Exemple d'URL : /products/get-all-products?subsidiaryId=123e4567-e89b-12d3-a456-426614174000
   */
  @Get()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [UserRole.ADMIN])
  findAll(@Req() req: any) {
    return this.productsService.findAll(req.user);
  }

  /**
   * Endpoint pour récupérer un produit par son ID
   * Exemple d'URL : /products/:id
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [UserRole.ADMIN])
  findOne(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: any) {
    return this.productsService.findOne(id, req.user);
  }

  /**
   * Endpoint pour mettre à jour un produit
   * Exemple d'URL : /products/:id
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [UserRole.ADMIN])
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Req() req: any,
  ) {
    return this.productsService.update(id, updateProductDto, req.user);
  }

  /**
   * Endpoint pour supprimer un produit
   * Exemple d'URL : /products/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [UserRole.ADMIN])
  remove(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: any) {
    return this.productsService.remove(id, req.user);
  }
}
