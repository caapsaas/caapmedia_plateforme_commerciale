import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  Patch,
  Delete,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { AttendanceRecordService } from './attendancerecord.service';
import {
  CreateAttendanceRecordDto,
  UpdateAttendanceRecordDto,
} from './dto/atendancerecord.dto';
import { RoleGuard } from '../../common/auth/role/role.guard';
import { Roles } from '../../common/auth/role/role.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';
import { PaginationQueryDto } from '../../common/pagination/dto/pagination-query.dto';

@Controller('hr/attendance-records')
@UseGuards(JwtAuthGuard, RoleGuard)
export class AttendanceRecordController {
  constructor(
    private readonly attendanceRecordService: AttendanceRecordService,
  ) {}

  // ------------------------------------------------------------------
  // Création manuelle d'une présence (HR / Admin)
  // ------------------------------------------------------------------
  @Post()
  @Roles('HR_MANAGER', 'ADMIN', 'SUPER_ADMIN')
  create(
    @Body() createAttendanceRecordDto: CreateAttendanceRecordDto,
    @Request() req,
  ) {
    // employeeId est optionnel dans le DTO (pour le flux QR),
    // mais obligatoire lors d'une création manuelle
    if (!createAttendanceRecordDto.employeeId) {
      throw new BadRequestException('employeeId is required');
    }

    const subsidiaryId = req.user.subsidiaryId;

    return this.attendanceRecordService.create(
      createAttendanceRecordDto,
      createAttendanceRecordDto.employeeId,
      subsidiaryId,
    );
  }

  // ------------------------------------------------------------------
  // Liste de toutes les présences de la filiale
  // ------------------------------------------------------------------
  @Get()
  @Roles('HR_MANAGER', 'ADMIN', 'SUPER_ADMIN')
  findAll(@Request() req, @Query() paginationQuery: PaginationQueryDto) {
    const subsidiaryId = req.user.subsidiaryId;
    return this.attendanceRecordService.findAll(subsidiaryId, paginationQuery);
  }

  // ------------------------------------------------------------------
  // Détail d'une présence
  // ------------------------------------------------------------------
  @Get(':id')
  @Roles('HR_MANAGER', 'ADMIN', 'SUPER_ADMIN')
  findOne(@Param('id') id: string) {
    return this.attendanceRecordService.findOne(id);
  }

  // ------------------------------------------------------------------
  // Mise à jour
  // ------------------------------------------------------------------
  @Patch(':id')
  @Roles('HR_MANAGER', 'ADMIN', 'SUPER_ADMIN')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAttendanceRecordDto: UpdateAttendanceRecordDto,
  ) {
    return this.attendanceRecordService.update(id, updateAttendanceRecordDto);
  }

  // ------------------------------------------------------------------
  // Suppression
  // ------------------------------------------------------------------
  @Delete(':id')
  @Roles('HR_MANAGER', 'ADMIN', 'SUPER_ADMIN')
  remove(@Param('id') id: string) {
    return this.attendanceRecordService.remove(id);
  }
}