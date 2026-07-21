import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SpecReferenceListsService } from './spec-reference-lists.service';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { RoleGuard } from 'src/common/auth/role/role.guard';
import { Roles } from 'src/common/auth/role/role.decorator';
import { UserRole } from '@prisma/client';
import {
  CreateReferenceListDto,
  CreateReferenceValueDto,
  UpdateReferenceListDto,
  UpdateReferenceValueDto,
} from './dto/spec-reference-list.dto';

const BUILDER_ROLES = [UserRole.ADMIN, UserRole.SUPER_ADMIN];
const READ_ROLES = [
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
  UserRole.COMMERCIAL,
  UserRole.CAISSIER,
  UserRole.PRODUCTION_DIRECTOR,
];

@Controller('spec-reference-lists')
@UseGuards(JwtAuthGuard, RoleGuard)
export class SpecReferenceListsController {
  constructor(private readonly service: SpecReferenceListsService) {}

  @Get()
  @Roles(...READ_ROLES)
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @Roles(...BUILDER_ROLES)
  create(@Body() dto: CreateReferenceListDto) {
    return this.service.create(dto);
  }

  @Get(':id')
  @Roles(...READ_ROLES)
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(...BUILDER_ROLES)
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateReferenceListDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(...BUILDER_ROLES)
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.remove(id);
  }

  @Post(':id/values')
  @Roles(...BUILDER_ROLES)
  addValue(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateReferenceValueDto,
  ) {
    return this.service.addValue(id, dto);
  }

  @Patch('values/:valueId')
  @Roles(...BUILDER_ROLES)
  updateValue(
    @Param('valueId', new ParseUUIDPipe()) valueId: string,
    @Body() dto: UpdateReferenceValueDto,
  ) {
    return this.service.updateValue(valueId, dto);
  }

  @Delete('values/:valueId')
  @Roles(...BUILDER_ROLES)
  removeValue(@Param('valueId', new ParseUUIDPipe()) valueId: string) {
    return this.service.removeValue(valueId);
  }
}
