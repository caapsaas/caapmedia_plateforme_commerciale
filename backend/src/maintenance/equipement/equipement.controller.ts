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
import { Roles } from 'src/common/auth/role/role.decorator';
import { UseGuards } from '@nestjs/common';
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
  create(@Body() createEquipementDto: CreateEquipmentDto, @Req() req: any) {
    return this.equipementService.create(createEquipementDto, req.user);
  }

  @Get()
  findAll(
    @Req() req: any,
    @Query('subsidiaryId') subsidiaryId: string | undefined,
  ) {
    return this.equipementService.findAll(req.user, subsidiaryId);
  }

  @Get('search')
  search(@Query() query: SearchEquipmentDto, @Req() req: any) {
    return this.equipementService.search(query, req.user);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.equipementService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateEquipementDto: UpdateEquipmentDto,
    @Req() req: any,
  ) {
    return this.equipementService.update(id, updateEquipementDto, req.user);
  }

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.equipementService.remove(id);
  }
}
