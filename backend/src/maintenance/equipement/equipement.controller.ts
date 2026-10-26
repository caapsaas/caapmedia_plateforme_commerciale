import {
  Controller,
  Body,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { RoleGuard } from 'src/common/auth/role/role.guard';
import { CurrentUser, Roles } from 'src/common/auth/role/role.decorator';
import type { JwtUser } from '../../common/auth/jwt/jwt-user.interface';
import { UserRole } from '@prisma/client';
import { EquipementService } from './equipement.service';
import {
  CreateEquipmentDto,
  UpdateEquipmentDto,
  SearchEquipmentDto,
} from './dto/create-equipement.dto';

const BASE_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.PRODUCTION_DIRECTOR,
  UserRole.FINANCIAL_DIRECTOR,
];

@Controller('equipements')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles(...BASE_ROLES)
export class EquipementController {
  constructor(private readonly equipementService: EquipementService) {}

  @Post()
  create(
    @Body() createEquipementDto: CreateEquipmentDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.equipementService.create(createEquipementDto, user);
  }

  @Get()
  findAll(
    @CurrentUser() user: JwtUser,
    @Query('subsidiaryId') subsidiaryId: string | undefined,
  ) {
    return this.equipementService.findAll(user, subsidiaryId);
  }

  @Get('search')
  search(@Query() query: SearchEquipmentDto, @CurrentUser() user: JwtUser) {
    return this.equipementService.search(query, user);
  }

  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.equipementService.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEquipementDto: UpdateEquipmentDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.equipementService.update(id, updateEquipementDto, user);
  }

  @Delete(':id')
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.equipementService.remove(id, user);
  }
}
