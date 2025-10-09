import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ParseUUIDPipe } from '@nestjs/common';
import { PayrollRecordService } from './payrollrecord.service';
import { CreatePayrollRecordDto, UpdatePayrollRecordDto } from './dto/payrollrecord.dto';
import { JwtAuthGuard } from '../../common/auth/jwt/jwt.guard';
import { RoleGuard } from '../../common/auth/role/role.guard';
import { Roles } from '../../common/auth/role/role.decorator';

@Controller('hr/payroll-records')
@UseGuards(JwtAuthGuard, RoleGuard)
export class PayrollrecordController {
  constructor(private readonly payrollRecordService: PayrollRecordService) {}

  @Post()
  @Roles('HR_MANAGER', 'ADMIN')
  create(@Body() createPayrollRecordDto: CreatePayrollRecordDto, @Request() req) {
    const subsidiaryId = req.user.subsidiaryId;
    return this.payrollRecordService.create(createPayrollRecordDto, createPayrollRecordDto.employeeId, subsidiaryId);
  }

  @Get()
  @Roles('HR_MANAGER', 'ADMIN')
  findAll(@Request() req) {
    const subsidiaryId = req.user.subsidiaryId;
    return this.payrollRecordService.findAll(subsidiaryId);
  }

  @Get(':id')
  @Roles('HR_MANAGER', 'ADMIN')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.payrollRecordService.findOne(id);
  }

  @Patch(':id')
  @Roles('HR_MANAGER', 'ADMIN')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updatePayrollRecordDto: UpdatePayrollRecordDto) {
    return this.payrollRecordService.update(id, updatePayrollRecordDto);
  }

  @Delete(':id')
  @Roles('HR_MANAGER', 'ADMIN')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.payrollRecordService.remove(id);
  }
}
