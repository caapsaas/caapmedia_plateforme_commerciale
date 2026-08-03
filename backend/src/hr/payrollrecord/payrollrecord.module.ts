import { Module } from '@nestjs/common';
import { PayrollRecordService } from './payrollrecord.service';
import { CameroonPayrollCalculatorService } from './cameroonpayrollcalculator.service';
import { PayrollRecordController } from './payrollrecord.controller';
import { UtilsModule } from '../../common/utils/utils.module';

@Module({
  imports: [UtilsModule],
  controllers: [PayrollRecordController],
  providers: [PayrollRecordService, CameroonPayrollCalculatorService],
})
export class PayrollrecordModule {}
