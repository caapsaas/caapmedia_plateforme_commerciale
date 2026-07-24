import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { CommercialParamsService } from './commercial-params.service';
import { UpsertCommercialParamsDto } from './dto/upsert-commercial-params.dto';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { RoleGuard } from 'src/common/auth/role/role.guard';
import { Roles, CurrentUser } from 'src/common/auth/role/role.decorator';
import { UserRole } from '@prisma/client';
import type { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';

@Controller('production/commercial-params')
@UseGuards(JwtAuthGuard, RoleGuard)
export class CommercialParamsController {
  constructor(private readonly service: CommercialParamsService) {}

  // Accessible à tous les rôles connectés : les commerciaux en ont besoin
  // pour valider la marge côté frontend (avant soumission de la commande).
  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.COMMERCIAL,
    UserRole.FINANCIAL_DIRECTOR,
  )
  findGlobal() {
    return this.service.findGlobal();
  }

  // Modification réservée au SUPER_ADMIN.
  @Put()
  @Roles(UserRole.SUPER_ADMIN)
  upsert(@Body() dto: UpsertCommercialParamsDto, @CurrentUser() user: JwtUser) {
    return this.service.upsert(dto, user);
  }
}
