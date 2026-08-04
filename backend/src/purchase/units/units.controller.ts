import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UnitsService } from './units.service';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { RoleGuard } from 'src/common/auth/role/role.guard';
import { Roles } from 'src/common/auth/role/role.decorator';
import { UserRole } from '@prisma/client';
import { CreateUnitDto, UpdateUnitDto } from './dto/unit.dto';

const MANAGE_ROLES = [
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
  UserRole.PURCHASING_MANAGER,
];
const READ_ROLES = [
  ...MANAGE_ROLES,
  UserRole.COMMERCIAL,
  UserRole.CAISSIER,
  UserRole.PRODUCTION_DIRECTOR,
  UserRole.FINANCIAL_DIRECTOR,
];

@Controller('purchase/units')
@UseGuards(JwtAuthGuard, RoleGuard)
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Get()
  @Roles(...READ_ROLES)
  findAll() {
    return this.unitsService.findAll();
  }

  @Post()
  @Roles(...MANAGE_ROLES)
  create(@Body() dto: CreateUnitDto) {
    return this.unitsService.create(dto);
  }

  @Get(':id')
  @Roles(...READ_ROLES)
  findOne(@Param('id') id: string) {
    return this.unitsService.findOne(id);
  }

  @Patch(':id')
  @Roles(...MANAGE_ROLES)
  update(@Param('id') id: string, @Body() dto: UpdateUnitDto) {
    return this.unitsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(...MANAGE_ROLES)
  remove(@Param('id') id: string) {
    return this.unitsService.remove(id);
  }
}
