import { Module } from '@nestjs/common';
import { PayrollRecordService } from './payrollrecord.service';
import { CameroonPayrollCalculatorService } from './cameroonpayrollcalculator.service';
import { PayrollBonusAndChargeService } from './payroll-bonus-and-charge.service';
import { PayrollCumulativeService } from './payroll-cumulative.service';
import { PayrollRecordController } from './payrollrecord.controller';
import { UtilsModule } from '../../common/utils/utils.module';
import { AccountingModule } from '../../accounting/accounting.module';

@Module({
  imports: [UtilsModule, AccountingModule],
  controllers: [PayrollRecordController],
  providers: [
    PayrollRecordService,
    CameroonPayrollCalculatorService,
    PayrollBonusAndChargeService,
    PayrollCumulativeService,
  ],
  exports: [
    PayrollBonusAndChargeService,
    PayrollRecordService,
    PayrollCumulativeService,
    CameroonPayrollCalculatorService,
  ],
})
export class PayrollrecordModule {}
