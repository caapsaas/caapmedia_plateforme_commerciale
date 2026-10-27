import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { ProductSpecsModule } from '../products/product-specs/product-specs.module';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
  imports: [ProductSpecsModule, NotificationsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
