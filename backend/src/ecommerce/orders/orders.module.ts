import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { UtilsModule } from 'src/common/utils/utils.module';

@Module({
  imports: [UtilsModule],
  controllers: [OrdersController],
  providers: [OrdersService]
})
export class OrdersModule {}
