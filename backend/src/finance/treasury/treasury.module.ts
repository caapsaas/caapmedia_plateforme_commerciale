import { Module } from '@nestjs/common';
import { TreasuryService } from './treasury.service';
import { TreasuryController } from './treasury.controller';
import { AccountingOutboxModule } from '../../accounting/outbox/accounting-outbox.module';
import { UtilsModule } from '../../common/utils/utils.module';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
  imports: [AccountingOutboxModule, UtilsModule, NotificationsModule],
  controllers: [TreasuryController],
  providers: [TreasuryService],
  exports: [TreasuryService],
})
export class TreasuryModule {}
