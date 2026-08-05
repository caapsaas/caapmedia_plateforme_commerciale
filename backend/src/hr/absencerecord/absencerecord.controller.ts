import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Delete,
  UseGuards,
  Request,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { AbsenceRecordService } from './absencerecord.service';
import {
  CreateAbsenceRecordDto,
  UpdateAbsenceRecordDto,
} from './dto/absencerecord.dto';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';
import { RoleGuard } from '../../common/auth/role/role.guard';
import { Roles } from '../../common/auth/role/role.decorator';
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

    const subsidiaryId = req.user.subsidiaryId;

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
  @Roles('ADMIN', 'SUPER_ADMIN')
  async generateDailyAbsences() {
    await this.absenceRecordService.generateDailyAbsences();
    return {
      success: true,
      message: 'Génération des absences du jour lancée avec succès',
    };
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
  findOne(@Param('id') id: string) {
    return this.absenceRecordService.findOne(id);
  }

  // ------------------------------------------------------------------
  // Mise à jour
  // ------------------------------------------------------------------
  @Patch(':id')
  @Roles('HR_MANAGER', 'ADMIN', 'SUPER_ADMIN')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAbsenceRecordDto: UpdateAbsenceRecordDto,
  ) {
    return this.absenceRecordService.update(id, updateAbsenceRecordDto);
  }

  // ------------------------------------------------------------------
  // Suppression
  // ------------------------------------------------------------------
  @Delete(':id')
  @Roles('HR_MANAGER', 'ADMIN', 'SUPER_ADMIN')
  remove(@Param('id') id: string) {
    return this.absenceRecordService.remove(id);
  }
}
