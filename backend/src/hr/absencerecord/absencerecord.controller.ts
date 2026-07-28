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
} from '@nestjs/common';
import { AbsenceRecordService } from './absencerecord.service';
import {
  CreateAbsenceRecordDto,
  UpdateAbsenceRecordDto,
} from './dto/absencerecord.dto';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';
import { RoleGuard } from '../../common/auth/role/role.guard';
import { Roles } from '../../common/auth/role/role.decorator';

@Controller('hr/absence-records')
@UseGuards(JwtAuthGuard, RoleGuard)
export class AbsencerecordController {
  constructor(private readonly absenceRecordService: AbsenceRecordService) {}

  @Post()
  @Roles('HR_MANAGER', 'ADMIN')
  create(
    @Body() createAbsenceRecordDto: CreateAbsenceRecordDto,
    @Request() req,
  ) {
    const subsidiaryId = req.user.subsidiaryId;
    return this.absenceRecordService.create(
      createAbsenceRecordDto,
      createAbsenceRecordDto.employeeId,
      subsidiaryId,
    );
  }

  @Get()
  @Roles('HR_MANAGER', 'ADMIN')
  findAll(@Request() req) {
    const subsidiaryId = req.user.subsidiaryId;
    return this.absenceRecordService.findAll(subsidiaryId);
  }

  @Get(':id')
  @Roles('HR_MANAGER', 'ADMIN')
  findOne(@Param('id') id: string) {
    return this.absenceRecordService.findOne(id);
  }

  @Patch(':id')
  @Roles('HR_MANAGER', 'ADMIN')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAbsenceRecordDto: UpdateAbsenceRecordDto,
  ) {
    return this.absenceRecordService.update(id, updateAbsenceRecordDto);
  }

  @Delete(':id')
  @Roles('HR_MANAGER', 'ADMIN')
  remove(@Param('id') id: string) {
    return this.absenceRecordService.remove(id);
  }
}
