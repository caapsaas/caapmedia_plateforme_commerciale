import { Module } from '@nestjs/common';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';

@Module({
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService, PrismaService],
  exports: [PurchaseOrdersService], // Exporter le service pour qu'il soit utilisable ailleurs
})
export class PurchaseOrdersModule {}
