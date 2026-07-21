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
  ForbiddenException,
} from '@nestjs/common';
import { AllowanceRuleService } from '../services/allowance-rule.service';
import { CreateAllowanceRuleDto, UpdateAllowanceRuleDto } from '../dto/allowance-rule.dto';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';
import { RoleGuard } from '../../common/auth/role/role.guard';
import { Roles, CurrentUser } from '../../common/auth/role/role.decorator';
import { JwtUser } from '../../common/auth/jwt/jwt-user.interface';
import { UserRole } from '@prisma/client';

@Controller('configuration/allowance-rules')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
export class AllowanceRuleController {
  constructor(private readonly service: AllowanceRuleService) {}

  private validateSubsidiaryAccess(user: JwtUser, subsidiaryId: string): void {
    if (user.role !== UserRole.ADMIN && user.subsidiaryId !== subsidiaryId) {
      throw new ForbiddenException('Vous n\'avez pas accès à cette filiale');
    }
  }

  @Post(':subsidiaryId')
  async create(
    @Param('subsidiaryId') subsidiaryId: string,
    @Body() dto: CreateAllowanceRuleDto,
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
  async getActiveRules(@Param('configId') configId: string) {
    return this.service.getActiveRules(configId);
  }

  @Get('config/:configId/applicable')
  async getApplicableAllowances(
    @Param('configId') configId: string,
    @Query('age') age?: number,
    @Query('salary') salary?: number,
    @Query('dependents') dependents?: number,
  ) {
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
    @Query('salary') salary: number,
    @Query('age') age?: number,
    @Query('dependents') dependents?: number,
  ) {
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
    return this.service.update(ruleId, dto, user);
  }

  @Delete(':ruleId')
  async delete(
    @Param('ruleId') ruleId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.service.delete(ruleId, user);
  }

  @Put(':ruleId/deactivate')
  async deactivate(
    @Param('ruleId') ruleId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.service.deactivate(ruleId, user);
  }
}
