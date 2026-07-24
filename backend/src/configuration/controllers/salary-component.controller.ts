import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { SalaryComponentService } from '../services/salary-component.service';
import { CreateSalaryComponentDto, UpdateSalaryComponentDto } from '../dto/salary-component.dto';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';
import { RoleGuard } from '../../common/auth/role/role.guard';
import { Roles, CurrentUser } from '../../common/auth/role/role.decorator';
import type { JwtUser } from '../../common/auth/jwt/jwt-user.interface';
import { UserRole } from '@prisma/client';

@Controller('configuration/salary-components')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
export class SalaryComponentController {
  constructor(private readonly service: SalaryComponentService) {}

  private validateSubsidiaryAccess(user: JwtUser, subsidiaryId: string): void {
    if (user.role !== UserRole.ADMIN && user.subsidiaryId !== subsidiaryId) {
      throw new ForbiddenException('Vous n\'avez pas accès à cette filiale');
    }
  }

  @Post(':subsidiaryId')
  async create(
    @Param('subsidiaryId') subsidiaryId: string,
    @Body() dto: CreateSalaryComponentDto,
    @CurrentUser() user: JwtUser,
  ) {
    this.validateSubsidiaryAccess(user, subsidiaryId);
    return this.service.create(subsidiaryId, dto, user);
  }

  @Get('config/:configId')
  async getByConfigId(@Param('configId') configId: string) {
    return this.service.getByConfigId(configId);
  }

  @Get('config/:configId/active')
  async getActiveByConfigId(@Param('configId') configId: string) {
    return this.service.getActiveByConfigId(configId);
  }

  @Put(':componentId')
  async update(
    @Param('componentId') componentId: string,
    @Body() dto: UpdateSalaryComponentDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.service.update(componentId, dto, user);
  }

  @Delete(':componentId')
  async delete(
    @Param('componentId') componentId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.service.delete(componentId, user);
  }

  @Put(':componentId/deactivate')
  async deactivate(
    @Param('componentId') componentId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.service.deactivate(componentId, user);
  }

  @Post(':configId/reorder')
  async reorder(
    @Param('configId') configId: string,
    @Body() components: { id: string; displayOrder: number }[],
    @CurrentUser() user: JwtUser,
  ) {
    return this.service.reorder(components, user);
  }
}
