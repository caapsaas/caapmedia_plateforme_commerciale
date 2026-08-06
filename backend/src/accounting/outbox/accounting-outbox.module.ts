import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AccountingOutboxService } from './accounting-outbox.service';
import { AccountingOutboxProcessor } from './accounting-outbox.processor';
import { JournalizationModule } from '../journalization/journalization.module';

@Module({
  imports: [ScheduleModule.forRoot(), JournalizationModule],
  providers: [AccountingOutboxService, AccountingOutboxProcessor],
  exports: [AccountingOutboxService],
})
export class AccountingOutboxModule {}
