import { Controller, Req } from '@nestjs/common';
import {
  Body,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { RoleGuard } from 'src/common/auth/role/role.guard';
import { UseGuards } from '@nestjs/common';
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { EquipementService } from './equipement.service';
import {
  CreateEquipmentDto,
  UpdateEquipmentDto,
  SearchEquipmentDto,
} from './dto/create-equipement.dto';

@Controller('equipements')
export class EquipementController {
  constructor(private readonly equipementService: EquipementService) {}

  /**
   * Endpoint pour créer un nouvel équipement
   * Exemple d'URL : /equipment
   */
  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [
    UserRole.ADMIN,
    UserRole.PRODUCTION_DIRECTOR,
    UserRole.FINANCIAL_DIRECTOR,
  ])
  create(@Body() createEquipementDto: CreateEquipmentDto, @Req() req: any) {
    return this.equipementService.create(createEquipementDto, req.user);
  }

  /**
   * Endpoint pour récupérer tous les équipements d'une filiale
   * Exemple d'URL : /equipment?subsidiaryId=123e4567-e89b-12d3-a456-426614174000
   */
  @Get()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [
    UserRole.ADMIN,
    UserRole.PRODUCTION_DIRECTOR,
    UserRole.FINANCIAL_DIRECTOR,
  ])
  findAll(@Req() req: any) {
    return this.equipementService.findAll(req.user);
  }

  /**
   * Endpoint pour rechercher les équipements selon plusieurs critères
   * Exemple d'URL : /equipment/search?equipmentName=Machine&status=ACTIVE
   */
  @Get('search')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [
    UserRole.ADMIN,
    UserRole.PRODUCTION_DIRECTOR,
    UserRole.FINANCIAL_DIRECTOR,
  ])
  search(@Query() query: SearchEquipmentDto, @Req() req: any) {
    return this.equipementService.search(query, req.user);
  }

  /**
   * Endpoint pour récupérer un équipement par son ID
   * Exemple d'URL : /equipment/:id
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [
    UserRole.ADMIN,
    UserRole.PRODUCTION_DIRECTOR,
    UserRole.FINANCIAL_DIRECTOR,
  ])
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.equipementService.findOne(id);
  }

  /**
   * Endpoint pour mettre à jour un équipement
   * Exemple d'URL : /equipment/:id
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [
    UserRole.ADMIN,
    UserRole.PRODUCTION_DIRECTOR,
    UserRole.FINANCIAL_DIRECTOR,
  ])
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateEquipementDto: UpdateEquipmentDto,
    @Req() req: any,
  ) {
    return this.equipementService.update(id, updateEquipementDto, req.user);
  }

  /**
   * Endpoint pour supprimer un équipement
   * Exemple d'URL : /equipment/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @SetMetadata('roles', [
    UserRole.ADMIN,
    UserRole.PRODUCTION_DIRECTOR,
    UserRole.FINANCIAL_DIRECTOR,
  ])
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.equipementService.remove(id);
  }
}
