import { Module } from '@nestjs/common';
import { AccountingBalanceService } from './accounting-balance.service';

@Module({
  providers: [AccountingBalanceService],
  exports: [AccountingBalanceService],
})
export class AccountingSharedModule {}
