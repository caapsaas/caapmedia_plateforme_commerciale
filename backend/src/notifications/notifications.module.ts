import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsSseController } from './notifications-sse.controller';
import { NotificationsSseService } from './notifications-sse.service';

@Module({
  controllers: [NotificationsController, NotificationsSseController],
  providers: [NotificationsService, NotificationsSseService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
