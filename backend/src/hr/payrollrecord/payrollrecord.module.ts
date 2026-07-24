import { Module } from '@nestjs/common';
import { PayrollRecordService } from './payrollrecord.service';
import { PayrollrecordController } from './payrollrecord.controller';

@Module({
  // On importe le PrismaModule, pas les services directement
  controllers: [PayrollrecordController],
  providers: [PayrollRecordService],
})
export class PayrollrecordModule {}
