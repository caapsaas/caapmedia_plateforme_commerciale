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
  AttendanceRecordQueryDto,
} from './dto/atendancerecord.dto';
import { RoleGuard } from '../../common/auth/role/role.guard';
import { Roles } from '../../common/auth/role/role.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';
import {
  resolveScopeContext,
  resolveEffectiveSubsidiaryId,
  assertSubsidiaryAccess,
} from '../../common/utils/subsidiary-scope';
import { PaginationQueryDto } from '../../common/pagination/dto/pagination-query.dto';

type AttendanceRecordWithLocation = {
  arrivalLatitude: unknown;
  arrivalLongitude: unknown;
  departureLatitude: unknown;
  departureLongitude: unknown;
  accuracyMeters: unknown;
  isGeolocationValid: unknown;
};

function hideLocation<T extends AttendanceRecordWithLocation>(record: T) {
  const attendance = { ...record } as Partial<AttendanceRecordWithLocation> &
    Record<string, unknown>;
  delete attendance.arrivalLatitude;
  delete attendance.arrivalLongitude;
  delete attendance.departureLatitude;
  delete attendance.departureLongitude;
  delete attendance.accuracyMeters;
  delete attendance.isGeolocationValid;
  return attendance as Omit<T, keyof AttendanceRecordWithLocation>;
}

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
  async create(
    @Body() createAttendanceRecordDto: CreateAttendanceRecordDto,
    @Request() req,
  ) {
    // employeeId est optionnel dans le DTO (pour le flux QR),
    // mais obligatoire lors d'une création manuelle
    if (!createAttendanceRecordDto.employeeId) {
      throw new BadRequestException('employeeId is required');
    }

    const ctx = resolveScopeContext(req.user);
    const subsidiaryId = resolveEffectiveSubsidiaryId(ctx);

    const record = await this.attendanceRecordService.create(
      createAttendanceRecordDto,
      createAttendanceRecordDto.employeeId,
      subsidiaryId,
    );
    return hideLocation(record);
  }

  // ------------------------------------------------------------------
  // Liste de toutes les présences de la filiale
  // ------------------------------------------------------------------
  @Get()
  @Roles('HR_MANAGER', 'ADMIN', 'SUPER_ADMIN')
  async findAll(@Request() req, @Query() query: AttendanceRecordQueryDto) {
    const paginationQuery = new PaginationQueryDto();
    paginationQuery.page = query.page ? Number(query.page) : 1;
    paginationQuery.limit = query.limit ? Number(query.limit) : 10;
    paginationQuery.search = query.search;

    const ctx = resolveScopeContext(req.user);
    const subsidiaryId = resolveEffectiveSubsidiaryId(ctx, query.subsidiaryId);
    const result = await this.attendanceRecordService.findAll(
      subsidiaryId,
      paginationQuery,
    );
    return { ...result, data: result.data.map(hideLocation) };
  }

  // ------------------------------------------------------------------
  // Détail d'une présence
  // ------------------------------------------------------------------
  @Get(':id')
  @Roles('HR_MANAGER', 'ADMIN', 'SUPER_ADMIN')
  async findOne(@Param('id') id: string, @Request() req) {
    const ctx = resolveScopeContext(req.user);
    const record = await this.attendanceRecordService.findOne(id);
    assertSubsidiaryAccess(record.subsidiaryId, ctx);
    return hideLocation(record);
  }

  // ------------------------------------------------------------------
  // Mise à jour
  // ------------------------------------------------------------------
  @Patch(':id')
  @Roles('HR_MANAGER', 'ADMIN', 'SUPER_ADMIN')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAttendanceRecordDto: UpdateAttendanceRecordDto,
    @Request() req,
  ) {
    const ctx = resolveScopeContext(req.user);
    const record = await this.attendanceRecordService.findOne(id);
    assertSubsidiaryAccess(record.subsidiaryId, ctx);
    const updated = await this.attendanceRecordService.update(
      id,
      updateAttendanceRecordDto,
    );
    return hideLocation(updated);
  }

  // ------------------------------------------------------------------
  // Suppression
  // ------------------------------------------------------------------
  @Delete(':id')
  @Roles('HR_MANAGER', 'ADMIN', 'SUPER_ADMIN')
  async remove(@Param('id') id: string, @Request() req) {
    const ctx = resolveScopeContext(req.user);
    const record = await this.attendanceRecordService.findOne(id);
    assertSubsidiaryAccess(record.subsidiaryId, ctx);
    const deleted = await this.attendanceRecordService.remove(id);
    return hideLocation(deleted);
  }
}
