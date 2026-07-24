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
import { TaxBracketService } from '../services/tax-bracket.service';
import { CreateTaxBracketDto, UpdateTaxBracketDto } from '../dto/tax-bracket.dto';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';
import { RoleGuard } from '../../common/auth/role/role.guard';
import { Roles, CurrentUser } from '../../common/auth/role/role.decorator';
import type { JwtUser } from '../../common/auth/jwt/jwt-user.interface';
import { UserRole } from '@prisma/client';

@Controller('configuration/tax-brackets')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
export class TaxBracketController {
  constructor(private readonly service: TaxBracketService) {}

  private validateSubsidiaryAccess(user: JwtUser, subsidiaryId: string): void {
    if (user.role !== UserRole.ADMIN && user.subsidiaryId !== subsidiaryId) {
      throw new ForbiddenException('Vous n\'avez pas accès à cette filiale');
    }
  }

  @Post(':subsidiaryId')
  async create(
    @Param('subsidiaryId') subsidiaryId: string,
    @Body() dto: CreateTaxBracketDto,
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
  async getActiveBrackets(@Param('configId') configId: string) {
    return this.service.getActiveBrackets(configId);
  }

  @Get('config/:configId/calculate-tax')
  async calculateTax(
    @Param('configId') configId: string,
    @Query('grossSalary') grossSalary: number,
    @Query('deductions') deductions?: number,
  ) {
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
    return this.service.update(bracketId, dto, user);
  }

  @Delete(':bracketId')
  async delete(
    @Param('bracketId') bracketId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.service.delete(bracketId, user);
  }
}
