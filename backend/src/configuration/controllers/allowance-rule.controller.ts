import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AllowanceRuleService } from '../services/allowance-rule.service';
import {
  CreateAllowanceRuleDto,
  UpdateAllowanceRuleDto,
} from '../dto/allowance-rule.dto';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';
import { RoleGuard } from '../../common/auth/role/role.guard';
import { Roles, CurrentUser } from '../../common/auth/role/role.decorator';
import type { JwtUser } from '../../common/auth/jwt/jwt-user.interface';
import { UserRole } from '@prisma/client';
import { ConfigurationAccessService } from '../services/configuration-access.service';

@Controller('configuration/allowance-rules')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
export class AllowanceRuleController {
  constructor(
    private readonly service: AllowanceRuleService,
    private readonly access: ConfigurationAccessService,
  ) {}

  @Post(':subsidiaryId')
  async create(
    @Param('subsidiaryId') subsidiaryId: string,
    @Body() dto: CreateAllowanceRuleDto,
    @CurrentUser() user: JwtUser,
  ) {
    await this.access.assertSubsidiaryConfigAccess(subsidiaryId, user);
    return this.service.create(subsidiaryId, dto, user);
  }

  @Get('config/:configId')
  async getByConfigId(@Param('configId') configId: string, @CurrentUser() user: JwtUser) {
    await this.access.assertConfigAccess(configId, user);
    return this.service.getByConfigId(configId);
  }

  @Get('config/:configId/active')
  async getActiveRules(@Param('configId') configId: string, @CurrentUser() user: JwtUser) {
    await this.access.assertConfigAccess(configId, user);
    return this.service.getActiveRules(configId);
  }

  @Get('config/:configId/applicable')
  async getApplicableAllowances(
    @Param('configId') configId: string,
    @CurrentUser() user: JwtUser,
    @Query('age') age?: number,
    @Query('salary') salary?: number,
    @Query('dependents') dependents?: number,
  ) {
    await this.access.assertConfigAccess(configId, user);
    return this.service.getApplicableAllowances(
      configId,
      age ? parseInt(age as any) : undefined,
      salary ? parseFloat(salary as any) : undefined,
      dependents ? parseInt(dependents as any) : undefined,
    );
  }

  @Get('config/:configId/calculate')
  async calculateAllowances(
    @Param('configId') configId: string,
    @CurrentUser() user: JwtUser,
    @Query('salary') salary: number,
    @Query('age') age?: number,
    @Query('dependents') dependents?: number,
  ) {
    await this.access.assertConfigAccess(configId, user);
    return this.service.calculateAllowances(
      configId,
      parseFloat(salary as any),
      age ? parseInt(age as any) : undefined,
      dependents ? parseInt(dependents as any) : undefined,
    );
  }

  @Put(':ruleId')
  async update(
    @Param('ruleId') ruleId: string,
    @Body() dto: UpdateAllowanceRuleDto,
    @CurrentUser() user: JwtUser,
  ) {
    await this.access.assertAllowanceRuleAccess(ruleId, user);
    return this.service.update(ruleId, dto, user);
  }

  @Delete(':ruleId')
  async delete(@Param('ruleId') ruleId: string, @CurrentUser() user: JwtUser) {
    await this.access.assertAllowanceRuleAccess(ruleId, user);
    return this.service.delete(ruleId, user);
  }

  @Put(':ruleId/deactivate')
  async deactivate(
    @Param('ruleId') ruleId: string,
    @CurrentUser() user: JwtUser,
  ) {
    await this.access.assertAllowanceRuleAccess(ruleId, user);
    return this.service.deactivate(ruleId, user);
  }
}
