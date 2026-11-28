import { Module } from '@nestjs/common';
import { ExternalTransactionService } from './external-transaction.service';
import { ExternalTransactionController } from './external-transaction.controller';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { AccountingOutboxModule } from 'src/accounting/outbox/accounting-outbox.module';

@Module({
  imports: [NotificationsModule, AccountingOutboxModule],
  controllers: [ExternalTransactionController],
  providers: [ExternalTransactionService],
  exports: [ExternalTransactionService],
})
export class ExternalTransactionModule {}
