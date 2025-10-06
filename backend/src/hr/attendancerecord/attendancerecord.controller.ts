import { Controller, Get, Post, Param, Body, UseGuards, Request, Patch, Delete } from '@nestjs/common';
import { AttendanceRecordService } from './attendancerecord.service';
import { CreateAttendanceRecordDto, UpdateAttendanceRecordDto } from './dto/atendancerecord.dto';
import { RoleGuard } from '../../common/auth/role/role.guard'; // ...
import { Roles } from '../../common/auth/role/role.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';

@Controller('hr/attendance-records')
@UseGuards(JwtAuthGuard, RoleGuard)
export class AttendanceRecordController {
  constructor(private readonly attendanceRecordService: AttendanceRecordService) {}

  @Post()
  @Roles('HR_MANAGER', 'ADMIN')
  create(@Body() createAttendanceRecordDto: CreateAttendanceRecordDto, @Request() req) {
    // On utilise l'employeeId validé par le DTO pour plus de sécurité
    const subsidiaryId = req.user.subsidiaryId;
    return this.attendanceRecordService.create(createAttendanceRecordDto, createAttendanceRecordDto.employeeId, subsidiaryId);
  }

  @Get()
  @Roles('HR_MANAGER', 'ADMIN')
  findAll(@Request() req) {
    const subsidiaryId = req.user.subsidiaryId;
    return this.attendanceRecordService.findAll(subsidiaryId);
  }

  @Get(':id')
  @Roles('HR_MANAGER', 'ADMIN') // Ajout de la protection pour la cohérence
  findOne(@Param('id') id: string) {
    return this.attendanceRecordService.findOne(id);
  }

  @Patch(':id')
  @Roles('HR_MANAGER', 'ADMIN')
  update(@Param('id') id: string, @Body() updateAttendanceRecordDto: UpdateAttendanceRecordDto) {
    return this.attendanceRecordService.update(id, updateAttendanceRecordDto);
  }

  @Delete(':id')
  @Roles('HR_MANAGER', 'ADMIN')
  remove(@Param('id') id: string) {
    return this.attendanceRecordService.remove(id);
  }
}