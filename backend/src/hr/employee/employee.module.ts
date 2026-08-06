import { Module } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { EmployeeController } from './employee.controller';
import { CommonModule } from 'src/common/common.module';
import { PayrollrecordModule } from '../payrollrecord/payrollrecord.module';

@Module({
  imports: [CommonModule, PayrollrecordModule],
  controllers: [EmployeeController],
  providers: [EmployeeService], // Prisma global, mais listé pour clarté
  exports: [EmployeeService],
})
export class EmployeeModule {}
