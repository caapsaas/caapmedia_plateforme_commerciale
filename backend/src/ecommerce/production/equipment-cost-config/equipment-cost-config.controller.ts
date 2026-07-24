import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EquipmentCostConfigService } from './equipment-cost-config.service';
import { UpsertEquipmentCostDto } from './dto/upsert-equipment-cost.dto';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { RoleGuard } from 'src/common/auth/role/role.guard';
import { Roles, CurrentUser } from 'src/common/auth/role/role.decorator';
import { UserRole } from '@prisma/client';
import type { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';

@Controller('production/equipment-costs')
@UseGuards(JwtAuthGuard, RoleGuard)
export class EquipmentCostConfigController {
  constructor(private readonly service: EquipmentCostConfigService) {}

  // Crée ou met à jour le coût horaire d'un équipement (upsert).
  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  upsert(@Body() dto: UpsertEquipmentCostDto, @CurrentUser() user: JwtUser) {
    return this.service.upsert(dto, user);
  }

  // Liste tous les équipements avec leur coût horaire.
  // SUPER_ADMIN : vue consolidée (toutes filiales) avec filtre subsidiaryId optionnel.
  // Autres rôles : scopé automatiquement à leur filiale.
  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  findAll(
    @Query('subsidiaryId') subsidiaryId: string | undefined,
    @CurrentUser() user: JwtUser,
  ) {
    return this.service.findAll(subsidiaryId, user);
  }

  // Équipements avec coût configuré — dropdown pour workflows et ProductionCostModal.
  // Accessible aux rôles qui créent des commandes ou des workflows.
  @Get('configured')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.PRODUCTION_DIRECTOR,
    UserRole.FINANCIAL_DIRECTOR,
  )
  findConfigured(@Query('subsidiaryId') subsidiaryId: string | undefined) {
    return this.service.findConfigured(subsidiaryId);
  }

  @Get(':equipmentId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  findOne(@Param('equipmentId') equipmentId: string) {
    return this.service.findOne(equipmentId);
  }
}
