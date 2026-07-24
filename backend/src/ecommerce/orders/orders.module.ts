import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { ProductSpecsModule } from '../products/product-specs/product-specs.module';

@Module({
  imports: [ProductSpecsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
