import { Module } from '@nestjs/common';
import { RecurringExpenseController } from './recurring-expense.controller';
import { RecurringExpenseService } from './recurring-expense.service';
import { AccountingOutboxModule } from '../../accounting/outbox/accounting-outbox.module';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
  imports: [AccountingOutboxModule, NotificationsModule],
  controllers: [RecurringExpenseController],
  providers: [RecurringExpenseService],
})
export class RecurringExpenseModule {}
