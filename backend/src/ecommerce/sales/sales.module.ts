import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { ProductSpecsModule } from '../products/product-specs/product-specs.module';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
  imports: [ProductSpecsModule, NotificationsModule],
  controllers: [SalesController],
  providers: [SalesService],
})
export class SalesModule {}
