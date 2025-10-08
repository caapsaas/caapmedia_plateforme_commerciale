import { Module } from '@nestjs/common';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PurchaseOrdersService } from './purchase-orders.service';
import { UtilsModule } from 'src/common/utils/utils.module';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';

@Module({
  imports: [UtilsModule],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService, PrismaService]
})
export class PurchaseOrdersModule {}
