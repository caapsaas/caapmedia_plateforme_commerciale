import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsSseController } from './notifications-sse.controller';
import { NotificationsSseService } from './notifications-sse.service';
import { OrderNotificationsService } from './order-notifications.service';

@Module({
  controllers: [NotificationsController, NotificationsSseController],
  providers: [
    NotificationsService,
    NotificationsSseService,
    OrderNotificationsService,
  ],
  exports: [NotificationsService, OrderNotificationsService],
})
export class NotificationsModule {}
