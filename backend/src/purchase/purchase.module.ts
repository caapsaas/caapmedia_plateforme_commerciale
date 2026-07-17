import { Module } from '@nestjs/common';
import { SuppliersModule } from './suppliers/suppliers.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';

@Module({
  imports: [SuppliersModule, PurchaseOrdersModule],
})
export class PurchaseModule {}
