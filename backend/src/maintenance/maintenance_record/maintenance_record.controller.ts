import {
  Controller,
  Post,
  Body,
  Patch,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { MaintenanceRecordService } from 'src/maintenance/maintenance_record/maintenance_record.service';
import {
  CreateMaintenanceRecordDto,
  UpdateMaintenanceRecordDto,
  SearchMaintenanceRecordDto,
} from 'src/maintenance/maintenance_record/dto/create-maintenance_record.dto';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { RoleGuard } from 'src/common/auth/role/role.guard';
import { Roles } from 'src/common/auth/role/role.decorator';
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

@Controller('maintenance-records')
export class MaintenanceRecordController {
  constructor(private service: MaintenanceRecordService) {}

  /**
   * Endpoint pour créer une nouvelle historique de maintenance
   * Exemple d'URL : /maintenance-records
   */
  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.PRODUCTION_DIRECTOR)
  create(@Body() createMaintenanceRecordDto: CreateMaintenanceRecordDto) {
    return this.service.create(createMaintenanceRecordDto);
  }

  /**
   * Endpoint pour récupérer toutes les historiques de maintenance d'un équipement
   * Exemple d'URL : /maintenance-records?equipmentId=123e4567-e89b-12d3-a456-426614174000
   */
  @Get()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.PRODUCTION_DIRECTOR)
  findAll(@Query('equipmentId', new ParseUUIDPipe()) equipmentId: string) {
    return this.service.findAll(equipmentId);
  }

  /**
   * Endpoint pour rechercher les historiques de maintenance selon plusieurs critères
   * Exemple d'URL : /maintenance-records/search?equipmentId=123e4567-e89b-12d3-a456-426614174000&technician=John
   */
  @Get('search')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.PRODUCTION_DIRECTOR)
  search(@Query() dto: SearchMaintenanceRecordDto) {
    return this.service.search(dto);
  }

  /**
   * Endpoint pour récupérer une historique de maintenance par son ID
   * Exemple d'URL : /maintenance-records/:id
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.PRODUCTION_DIRECTOR)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  /**
   * Endpoint pour mettre à jour une historique de maintenance
   * Exemple d'URL : /maintenance-records/:id
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.PRODUCTION_DIRECTOR)
  update(
    @Param('id') id: string,
    @Body() updateMaintenanceRecordDto: UpdateMaintenanceRecordDto,
  ) {
    return this.service.update(id, updateMaintenanceRecordDto);
  }

  /**
   * Endpoint pour supprimer une historique de maintenance
   * Exemple d'URL : /maintenance-records/:id
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN, UserRole.PRODUCTION_DIRECTOR)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
