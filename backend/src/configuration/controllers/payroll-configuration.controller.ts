import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { PayrollConfigurationService } from '../services/payroll-configuration.service';
import { UpdatePayrollConfigDto } from '../dto/payroll-configuration.dto';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';
import { RoleGuard } from '../../common/auth/role/role.guard';
import { Roles, CurrentUser } from '../../common/auth/role/role.decorator';
import type { JwtUser } from '../../common/auth/jwt/jwt-user.interface';
import { UserRole } from '@prisma/client';
import { ConfigurationAccessService } from '../services/configuration-access.service';

@Controller('configuration/payroll')
@UseGuards(JwtAuthGuard, RoleGuard)
export class PayrollConfigurationController {
  constructor(
    private readonly service: PayrollConfigurationService,
    private readonly access: ConfigurationAccessService,
  ) {}

  @Get(':subsidiaryId/full')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async getConfigurationFull(
    @Param('subsidiaryId') subsidiaryId: string,
    @CurrentUser() user: JwtUser,
  ) {
    await this.access.assertSubsidiaryConfigAccess(subsidiaryId, user);
    return this.service.getOrCreateBySubsidiary(subsidiaryId);
  }

  @Get(':subsidiaryId')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async getConfiguration(
    @Param('subsidiaryId') subsidiaryId: string,
    @CurrentUser() user: JwtUser,
  ) {
    await this.access.assertSubsidiaryConfigAccess(subsidiaryId, user);
    return this.service.getConfiguration(subsidiaryId);
  }

  @Put(':subsidiaryId')
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async updateConfiguration(
    @Param('subsidiaryId') subsidiaryId: string,
    @Body() dto: UpdatePayrollConfigDto,
    @CurrentUser() user: JwtUser,
  ) {
    await this.access.assertSubsidiaryConfigAccess(subsidiaryId, user);
    return this.service.updateConfiguration(subsidiaryId, dto, user);
  }
}
