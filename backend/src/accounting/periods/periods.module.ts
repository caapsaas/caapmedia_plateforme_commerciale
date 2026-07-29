import { Module } from '@nestjs/common';
import { PeriodsService } from './periods.service';
import { PeriodsController } from './periods.controller';
import { AccountingAccessModule } from 'src/accounting-access/accounting-access.module';

@Module({
  imports: [AccountingAccessModule],
  providers: [PeriodsService],
  controllers: [PeriodsController],
  exports: [PeriodsService],
})
export class PeriodsModule {}
