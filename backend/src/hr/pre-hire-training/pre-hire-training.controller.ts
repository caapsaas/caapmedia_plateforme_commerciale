import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';
import { RoleGuard } from '../../common/auth/role/role.guard';
import { Roles } from '../../common/auth/role/role.decorator';
import { resolveEffectiveSubsidiaryId, resolveScopeContext, assertSubsidiaryAccess } from '../../common/utils/subsidiary-scope';
import { CreatePreHireTrainingDto, UpdatePreHireTrainingDto } from './dto/pre-hire-training.dto';
import { PreHireTrainingService } from './pre-hire-training.service';
import { CreateEmployeeDto } from '../employee/dto/employee.dto';

const HR_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'PRE_HIRE_MANAGER'] as const;

@ApiTags('Pre-hire training')
@ApiBearerAuth()
@Controller('hr/pre-hire-training')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles(...HR_ROLES)
export class PreHireTrainingController {
  constructor(private readonly service: PreHireTrainingService) {}

  @Get()
  async findAll(@Request() req, @Query('subsidiaryId') requestedSubsidiaryId?: string) {
    const ctx = resolveScopeContext(req.user);
    return this.service.findAll(resolveEffectiveSubsidiaryId(ctx, requestedSubsidiaryId));
  }

  @Post()
  @Roles('PRE_HIRE_MANAGER')
  create(@Body() dto: CreatePreHireTrainingDto, @Request() req) {
    const ctx = resolveScopeContext(req.user);
    const subsidiaryId = resolveEffectiveSubsidiaryId(ctx, dto.subsidiaryId);
    if (!subsidiaryId) throw new BadRequestException('Une filiale doit être sélectionnée.');
    return this.service.create(dto, subsidiaryId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const item = await this.service.findOne(id);
    assertSubsidiaryAccess(item.subsidiaryId, resolveScopeContext(req.user));
    return item;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePreHireTrainingDto, @Request() req) {
    const activeRole = req.user?.activeRole || req.user?.role || req.user?.userRole;
    const submitsResults =
      Object.prototype.hasOwnProperty.call(dto, 'acquiredClients') ||
      Object.prototype.hasOwnProperty.call(dto, 'acquiredProspects');
    if (submitsResults && activeRole !== 'PRE_HIRE_MANAGER' && activeRole !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Seul le responsable pré-embauche peut renseigner les résultats commerciaux.');
    }
    const item = await this.service.findOne(id);
    assertSubsidiaryAccess(item.subsidiaryId, resolveScopeContext(req.user));
    return this.service.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const item = await this.service.findOne(id);
    assertSubsidiaryAccess(item.subsidiaryId, resolveScopeContext(req.user));
    return this.service.remove(id);
  }

  @Post(':id/convert')
  async convertToEmployee(@Param('id') id: string, @Body() dto: CreateEmployeeDto, @Request() req) {
    const candidate = await this.service.findOne(id);
    assertSubsidiaryAccess(candidate.subsidiaryId, resolveScopeContext(req.user));
    return this.service.convertToEmployee(id, dto);
  }
}
