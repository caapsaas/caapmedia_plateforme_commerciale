import { Module } from '@nestjs/common';
import { RecurringExpenseController } from './recurring-expense.controller';
import { RecurringExpenseService } from './recurring-expense.service';
import { AccountingOutboxModule } from '../../accounting/outbox/accounting-outbox.module';

@Module({
  imports: [AccountingOutboxModule],
  controllers: [RecurringExpenseController],
  providers: [RecurringExpenseService],
})
export class RecurringExpenseModule {}
