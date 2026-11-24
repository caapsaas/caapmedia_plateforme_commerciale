import { Module } from '@nestjs/common';
import { EntriesModule } from '../../accounting/entries/entries.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { ProductSpecsModule } from '../products/product-specs/product-specs.module';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
  imports: [ProductSpecsModule, NotificationsModule, EntriesModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
