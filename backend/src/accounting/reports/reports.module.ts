import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { AccountingSharedModule } from '../shared/accounting-shared.module';
import { AccountingAccessModule } from 'src/accounting-access/accounting-access.module';

@Module({
  imports: [AccountingSharedModule, AccountingAccessModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
