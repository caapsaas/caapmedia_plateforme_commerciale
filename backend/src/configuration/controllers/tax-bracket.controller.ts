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
import { TaxBracketService } from '../services/tax-bracket.service';
import {
  CreateTaxBracketDto,
  UpdateTaxBracketDto,
} from '../dto/tax-bracket.dto';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';
import { RoleGuard } from '../../common/auth/role/role.guard';
import { Roles, CurrentUser } from '../../common/auth/role/role.decorator';
import type { JwtUser } from '../../common/auth/jwt/jwt-user.interface';
import { UserRole } from '@prisma/client';
import { ConfigurationAccessService } from '../services/configuration-access.service';

@Controller('configuration/tax-brackets')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
export class TaxBracketController {
  constructor(
    private readonly service: TaxBracketService,
    private readonly access: ConfigurationAccessService,
  ) {}

  @Post(':subsidiaryId')
  async create(
    @Param('subsidiaryId') subsidiaryId: string,
    @Body() dto: CreateTaxBracketDto,
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
  async getActiveBrackets(@Param('configId') configId: string, @CurrentUser() user: JwtUser) {
    await this.access.assertConfigAccess(configId, user);
    return this.service.getActiveBrackets(configId);
  }

  @Get('config/:configId/calculate-tax')
  async calculateTax(
    @Param('configId') configId: string,
    @CurrentUser() user: JwtUser,
    @Query('grossSalary') grossSalary: number,
    @Query('deductions') deductions?: number,
  ) {
    await this.access.assertConfigAccess(configId, user);
    return this.service.getTaxableIncome(
      parseFloat(grossSalary as any),
      configId,
      deductions ? parseFloat(deductions as any) : 0,
    );
  }

  @Put(':bracketId')
  async update(
    @Param('bracketId') bracketId: string,
    @Body() dto: UpdateTaxBracketDto,
    @CurrentUser() user: JwtUser,
  ) {
    await this.access.assertTaxBracketAccess(bracketId, user);
    return this.service.update(bracketId, dto, user);
  }

  @Delete(':bracketId')
  async delete(
    @Param('bracketId') bracketId: string,
    @CurrentUser() user: JwtUser,
  ) {
    await this.access.assertTaxBracketAccess(bracketId, user);
    return this.service.delete(bracketId, user);
  }
}
