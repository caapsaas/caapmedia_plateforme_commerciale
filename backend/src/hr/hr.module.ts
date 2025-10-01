import { Module } from '@nestjs/common';
import { EmployeeModule } from './employee/employee.module';
import { AttendancerecordModule } from './attendancerecord/attendancerecord.module';
import { PayrollrecordModule } from './payrollrecord/payrollrecord.module';
import { AbsencerecordModule } from './absencerecord/absencerecord.module';

@Module({
  imports: [EmployeeModule, AttendancerecordModule, PayrollrecordModule, AbsencerecordModule]
})
export class HrModule {}
