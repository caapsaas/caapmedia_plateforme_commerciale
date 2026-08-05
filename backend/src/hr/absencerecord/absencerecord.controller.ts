import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseUUIDPipe,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { AbsenceRecordService } from './absencerecord.service';
import {
  CreateAbsenceRecordDto,
  UpdateAbsenceRecordDto,
} from './dto/absencerecord.dto';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';
import { RoleGuard } from '../../common/auth/role/role.guard';
import { Roles } from '../../common/auth/role/role.decorator';
import {
  resolveScopeContext,
  withSubsidiaryScope,
  resolveEffectiveSubsidiaryId,
  assertSubsidiaryAccess,
} from '../../common/utils/subsidiary-scope';
import { PaginationQueryDto } from '../../common/pagination/dto/pagination-query.dto';

@Controller('hr/absence-records')
@UseGuards(JwtAuthGuard, RoleGuard)
export class AbsencerecordController {
  constructor(private readonly absenceRecordService: AbsenceRecordService) {}

  // ------------------------------------------------------------------
  // Création manuelle d'une absence
  // ------------------------------------------------------------------
  @Post()
  @Roles('HR_MANAGER', 'ADMIN', 'SUPER_ADMIN')
  create(
    @Body() createAbsenceRecordDto: CreateAbsenceRecordDto,
    @Request() req,
  ) {
    if (!createAbsenceRecordDto.employeeId) {
      throw new BadRequestException('employeeId is required');
    }

    const ctx = resolveScopeContext(req.user);
    const subsidiaryId = resolveEffectiveSubsidiaryId(ctx);

    return this.absenceRecordService.create(
      createAbsenceRecordDto,
      createAbsenceRecordDto.employeeId,
      subsidiaryId,
    );
  }

  // ------------------------------------------------------------------
  // ★ Génération manuelle des absences du jour
  //    (le cron s'exécute aussi automatiquement à 18h)
  // ------------------------------------------------------------------
  @Post('generate-daily')
  @Roles('HR_MANAGER', 'ADMIN', 'SUPER_ADMIN')
  async generateDailyAbsences(@Request() req) {
    const ctx = resolveScopeContext(req.user);
    const subsidiaryId = resolveEffectiveSubsidiaryId(ctx);
    return this.absenceRecordService.generateDailyAbsences(subsidiaryId);
  }

  // ------------------------------------------------------------------
  // Liste des absences de la filiale
  // ------------------------------------------------------------------
  @Get()
  @Roles('HR_MANAGER', 'ADMIN', 'SUPER_ADMIN')
  findAll(@Request() req, @Query() paginationQuery: PaginationQueryDto) {
    const subsidiaryId = req.user.subsidiaryId;
    return this.absenceRecordService.findAll(subsidiaryId, paginationQuery);
  }

  // ------------------------------------------------------------------
  // Détail d'une absence
  // ------------------------------------------------------------------
  @Get(':id')
  @Roles('HR_MANAGER', 'ADMIN', 'SUPER_ADMIN')
  async findOne(@Param('id') id: string, @Request() req) {
    const ctx = resolveScopeContext(req.user);
    const record = await this.absenceRecordService.findOne(id);
    assertSubsidiaryAccess(record.subsidiaryId, ctx);
    return record;
  }

  // ------------------------------------------------------------------
  // Mise à jour
  // ------------------------------------------------------------------
  @Patch(':id')
  @Roles('HR_MANAGER', 'ADMIN', 'SUPER_ADMIN')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAbsenceRecordDto: UpdateAbsenceRecordDto,
    @Request() req,
  ) {
    const ctx = resolveScopeContext(req.user);
    const record = await this.absenceRecordService.findOne(id);
    assertSubsidiaryAccess(record.subsidiaryId, ctx);
    return this.absenceRecordService.update(id, updateAbsenceRecordDto);
  }

  // ------------------------------------------------------------------
  // Suppression
  // ------------------------------------------------------------------
  @Delete(':id')
  @Roles('HR_MANAGER', 'ADMIN', 'SUPER_ADMIN')
  async remove(@Param('id') id: string, @Request() req) {
    const ctx = resolveScopeContext(req.user);
    const record = await this.absenceRecordService.findOne(id);
    assertSubsidiaryAccess(record.subsidiaryId, ctx);
    return this.absenceRecordService.remove(id);
  }
}
