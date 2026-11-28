import { Module } from '@nestjs/common';
import { DebtsService } from './debts.service';
import { DebtsController } from './debts.controller';
import { AccountingOutboxModule } from '../../accounting/outbox/accounting-outbox.module';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
  imports: [AccountingOutboxModule, NotificationsModule],
  controllers: [DebtsController],
  providers: [DebtsService],
  exports: [DebtsService],
})
export class DebtsModule {}
