import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  SetMetadata,
  } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/create-supplier.dto';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('purchasing/suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) { }


  /**
   * Endpoint pour creer un fournisseur
   * Exemple d'url: /purchasing/suppliers
   */
  @Post()
  @SetMetadata('roles', [UserRole.ADMIN])
  create(@Body() createSupplierDto: CreateSupplierDto, @Req() req) {
    return this.suppliersService.create(createSupplierDto, req.user);
  }

  /**
   * EndPoint pour recuperer tout les fournisseurs d'une filiale
   * Exemple d'url: /purchasing/suppliers
   */
  @Get()
  @SetMetadata('roles', [UserRole.ADMIN])
  findAll(@Req() req) {
    return this.suppliersService.findAll(req.user);
  }

  /**
   * Endpoint pour recuperer un fournisseur
   * Exemple d'url: /purchasing/suppliers/:id
   */
  @Get(':id')
  @SetMetadata('roles', [UserRole.ADMIN])
  findOne(@Param('id') id: string, @Req() req) {
    return this.suppliersService.findOne(id, req.user);
  }

  /**
   * Endpoint pour mettre a jour un fournisseur
   * Exemple d'url: /purchasing/suppliers/:id
   */
  @Patch(':id')
  @SetMetadata('roles', [UserRole.ADMIN])
  update(@Param('id') id: string, @Body() updateSupplierDto: UpdateSupplierDto, @Req() req) {
    return this.suppliersService.update(id, updateSupplierDto, req.user);
  }

  /**
   * Endpoint pour supprimer un fournisseur
   * Exemple d'url: /purchasing/suppliers/:id
   */
  @Delete(':id')
  @SetMetadata('roles', [UserRole.ADMIN])
  remove(@Param('id') id: string, @Req() req) {
    return this.suppliersService.remove(id, req.user);
  }
}

