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
import { ProductSpecsService } from './product-specs.service';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { RoleGuard } from 'src/common/auth/role/role.guard';
import { Roles } from 'src/common/auth/role/role.decorator';
import { UserRole } from '@prisma/client';
import {
  CreateSpecGroupDto,
  CreateSpecificationDto,
  ReorderSpecificationsDto,
  UpdateSpecGroupDto,
  UpdateSpecificationDto,
} from './dto/product-spec.dto';

// Configuration réservée aux admins (Builder) ; la lecture de la définition
// (form-definition) est ouverte à tout rôle amené à créer une commande.
const BUILDER_ROLES = [UserRole.ADMIN, UserRole.SUPER_ADMIN];
const READ_ROLES = [
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
  UserRole.COMMERCIAL,
  UserRole.CAISSIER,
  UserRole.PRODUCTION_DIRECTOR,
];

@Controller('products')
export class ProductSpecsController {
  constructor(private readonly productSpecsService: ProductSpecsService) {}

  @Get(':id/form-definition')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(...READ_ROLES)
  getFormDefinition(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productSpecsService.getFormDefinition(id);
  }

  @Get(':id/spec-structure')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(...BUILDER_ROLES)
  getBuilderStructure(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productSpecsService.getBuilderStructure(id);
  }

  @Post(':id/spec-groups')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(...BUILDER_ROLES)
  createGroup(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateSpecGroupDto,
  ) {
    return this.productSpecsService.createGroup(id, dto);
  }

  @Patch('spec-groups/:groupId')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(...BUILDER_ROLES)
  updateGroup(
    @Param('groupId', new ParseUUIDPipe()) groupId: string,
    @Body() dto: UpdateSpecGroupDto,
  ) {
    return this.productSpecsService.updateGroup(groupId, dto);
  }

  @Delete('spec-groups/:groupId')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(...BUILDER_ROLES)
  removeGroup(@Param('groupId', new ParseUUIDPipe()) groupId: string) {
    return this.productSpecsService.removeGroup(groupId);
  }

  @Post(':id/specifications')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(...BUILDER_ROLES)
  createSpecification(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateSpecificationDto,
  ) {
    return this.productSpecsService.createSpecification(id, dto);
  }

  @Patch('specifications/:specId')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(...BUILDER_ROLES)
  updateSpecification(
    @Param('specId', new ParseUUIDPipe()) specId: string,
    @Body() dto: UpdateSpecificationDto,
  ) {
    return this.productSpecsService.updateSpecification(specId, dto);
  }

  @Delete('specifications/:specId')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(...BUILDER_ROLES)
  removeSpecification(@Param('specId', new ParseUUIDPipe()) specId: string) {
    return this.productSpecsService.removeSpecification(specId);
  }

  @Patch(':id/specifications/reorder')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(...BUILDER_ROLES)
  reorderSpecifications(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ReorderSpecificationsDto,
  ) {
    return this.productSpecsService.reorderSpecifications(id, dto);
  }
}
