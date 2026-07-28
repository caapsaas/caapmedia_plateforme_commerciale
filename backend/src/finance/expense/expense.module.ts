import { Module } from '@nestjs/common';
import { ExpensesController } from './expense.controller';
import { ExpensesService } from './expense.service';
import { AccountingOutboxModule } from '../../accounting/outbox/accounting-outbox.module';

@Module({
  imports: [AccountingOutboxModule],
  controllers: [ExpensesController],
  providers: [ExpensesService],
})
export class ExpenseModule {}
