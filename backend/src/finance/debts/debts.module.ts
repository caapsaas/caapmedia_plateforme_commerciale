import { Module } from '@nestjs/common';
import { DebtsService } from './debts.service';
import { DebtsController } from './debts.controller';
import { TreasuryModule } from '../treasury/treasury.module';
import { AccountingOutboxModule } from '../../accounting/outbox/accounting-outbox.module';

@Module({
  imports: [TreasuryModule, AccountingOutboxModule],
  controllers: [DebtsController],
  providers: [DebtsService],
  exports: [DebtsService],
})
export class DebtsModule {}
