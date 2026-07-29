import { Module } from '@nestjs/common';
import { AccountingOutboxService } from './accounting-outbox.service';
import { AccountingOutboxProcessor } from './accounting-outbox.processor';
import { JournalizationModule } from '../journalization/journalization.module';

@Module({
  imports: [JournalizationModule],
  providers: [AccountingOutboxService, AccountingOutboxProcessor],
  exports: [AccountingOutboxService],
})
export class AccountingOutboxModule {}
