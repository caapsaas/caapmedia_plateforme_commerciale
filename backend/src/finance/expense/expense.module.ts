import { Module } from '@nestjs/common';
import { ExpensesController } from './expense.controller';
import { ExpensesService } from './expense.service';
import { AccountingOutboxModule } from '../../accounting/outbox/accounting-outbox.module';
import { UtilsModule } from '../../common/utils/utils.module';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
  imports: [AccountingOutboxModule, UtilsModule, NotificationsModule],
  controllers: [ExpensesController],
  providers: [ExpensesService],
})
export class ExpenseModule {}
