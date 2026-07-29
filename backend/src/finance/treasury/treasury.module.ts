import { Module } from '@nestjs/common';
import { TreasuryService } from './treasury.service';
import { TreasuryController } from './treasury.controller';
import { AccountingOutboxModule } from '../../accounting/outbox/accounting-outbox.module';

@Module({
  imports: [AccountingOutboxModule],
  controllers: [TreasuryController],
  providers: [TreasuryService],
  exports: [TreasuryService],
})
export class TreasuryModule {}
