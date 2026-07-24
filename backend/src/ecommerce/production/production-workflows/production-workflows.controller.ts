import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProductionWorkflowsService } from './production-workflows.service';
import { CreateWorkflowDto, UpdateWorkflowDto } from './dto/workflow.dto';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { RoleGuard } from 'src/common/auth/role/role.guard';
import { Roles } from 'src/common/auth/role/role.decorator';
import { UserRole } from '@prisma/client';

@Controller('production/workflows')
@UseGuards(JwtAuthGuard, RoleGuard)
export class ProductionWorkflowsController {
  constructor(private readonly service: ProductionWorkflowsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  create(@Body() dto: CreateWorkflowDto) {
    return this.service.create(dto);
  }

  // Vue consolidée : SUPER_ADMIN voit tous les workflows, filtre par filiale optionnel.
  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  findAll(@Query('subsidiaryId') subsidiaryId: string | undefined) {
    return this.service.findAll(subsidiaryId);
  }

  // Résolution du workflow d'un service : utilisé par le frontend lors de la
  // création d'une commande pour pré-remplir les machines.
  @Get('resolve/:itemId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COMMERCIAL)
  resolve(@Param('itemId') itemId: string) {
    return this.service.resolve(itemId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateWorkflowDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
