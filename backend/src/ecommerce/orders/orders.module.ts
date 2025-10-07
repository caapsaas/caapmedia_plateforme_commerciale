import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { UtilsModule } from 'src/common/utils/utils.module';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';

@Module({
  imports: [UtilsModule],
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService]
})
export class OrdersModule {}
