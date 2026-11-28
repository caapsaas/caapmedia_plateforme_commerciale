import { Module } from '@nestjs/common';
import { PrefinancementController } from './prefinancement.controller';
import { PrefinancementService } from './prefinancement.service';
import { TreasuryModule } from '../treasury/treasury.module';
import { AccountingOutboxModule } from '../../accounting/outbox/accounting-outbox.module';

@Module({
  imports: [TreasuryModule, AccountingOutboxModule],
  controllers: [PrefinancementController],
  providers: [PrefinancementService],
  exports: [PrefinancementService],
})
export class PrefinancementModule {}
