import { Module } from '@nestjs/common';
import { CashRemittanceController } from './cash-remittance.controller';
import { CashRemittanceService } from './cash-remittance.service';
import { AccountingOutboxModule } from '../../accounting/outbox/accounting-outbox.module';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
  imports: [AccountingOutboxModule, NotificationsModule],
  controllers: [CashRemittanceController],
  providers: [CashRemittanceService],
})
export class CashRemittanceModule {}
