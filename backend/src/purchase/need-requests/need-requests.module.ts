import { AccountingOutboxModule } from '../../accounting/outbox/accounting-outbox.module';
import { NotificationsModule } from '../../notifications/notifications.module';
import { Module } from '@nestjs/common';
import { NeedRequestsController } from './need-requests.controller';
import { NeedRequestsService } from './need-requests.service';
@Module({
  imports: [NotificationsModule, AccountingOutboxModule],
  controllers: [NeedRequestsController],
  providers: [NeedRequestsService],
})
export class NeedRequestsModule {}
