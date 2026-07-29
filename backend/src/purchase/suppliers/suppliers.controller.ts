import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
  Req,
  Query,
  SetMetadata,
} from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import {
  CreateSupplierDto,
  UpdateSupplierDto,
} from './dto/create-supplier.dto';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { RoleGuard } from 'src/common/auth/role/role.guard';
import { Roles } from 'src/common/auth/role/role.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('purchasing/suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  /**
   * Endpoint pour creer un fournisseur
   * Exemple d'url: /purchasing/suppliers
   */
  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createSupplierDto: CreateSupplierDto, @Req() req) {
    return this.suppliersService.create(createSupplierDto, req.user);
  }

  /**
   * EndPoint pour recuperer les fournisseurs (toutes filiales pour SUPER_ADMIN,
   * scope filiale sinon - drill-down possible via ?subsidiaryId=)
   * Exemple d'url: /purchasing/suppliers
   */
  @Get()
  @Roles(UserRole.ADMIN)
  findAll(@Req() req, @Query('subsidiaryId') subsidiaryId?: string) {
    return this.suppliersService.findAll(req.user, subsidiaryId);
  }

  /**
   * Endpoint pour recuperer un fournisseur
   * Exemple d'url: /purchasing/suppliers/:id
   */
  @Get(':id')
  @Roles(UserRole.ADMIN)
  findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.suppliersService.findOne(id, req.user);
  }

  /**
   * Endpoint pour mettre a jour un fournisseur
   * Exemple d'url: /purchasing/suppliers/:id
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSupplierDto: UpdateSupplierDto,
    @Req() req,
  ) {
    return this.suppliersService.update(id, updateSupplierDto, req.user);
  }

  /**
   * Endpoint pour supprimer un fournisseur
   * Exemple d'url: /purchasing/suppliers/:id
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.suppliersService.remove(id, req.user);
  }
}
