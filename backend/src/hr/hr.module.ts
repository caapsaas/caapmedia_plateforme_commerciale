import { Module } from '@nestjs/common';
import { EmployeeModule } from './employee/employee.module';
import { AttendancerecordModule } from './attendancerecord/attendancerecord.module';
import { PayrollrecordModule } from './payrollrecord/payrollrecord.module';
import { AbsencerecordModule } from './absencerecord/absencerecord.module';
import { PreHireTrainingModule } from './pre-hire-training/pre-hire-training.module';

@Module({
  imports: [
    EmployeeModule,
    AttendancerecordModule,
    PayrollrecordModule,
    AbsencerecordModule,
    PreHireTrainingModule,
  ],
})
export class HrModule {}
