import { Module } from '@nestjs/common';
import { BalancesheetService } from './balancesheet.service';
import { BalancesheetController } from './balancesheet.controller';
import { AccountingSharedModule } from '../../accounting/shared/accounting-shared.module';

@Module({
  imports: [AccountingSharedModule],
  providers: [BalancesheetService],
  controllers: [BalancesheetController],
})
export class BalancesheetModule {}
