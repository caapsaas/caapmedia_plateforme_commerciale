import { Module } from '@nestjs/common';
import { AccountingAccessService } from './accounting-access.service';
import { AccountingAccessController } from './accounting-access.controller';
import { AccountingAccessGuard } from './accounting-access.guard';
import { EmailService } from 'src/common/utils/email/email.service';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [AccountingAccessController],
  providers: [AccountingAccessService, AccountingAccessGuard, EmailService],
  exports: [AccountingAccessService, AccountingAccessGuard],
})
export class AccountingAccessModule {}
