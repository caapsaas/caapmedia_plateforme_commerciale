import { Module } from '@nestjs/common';
import { SuppliersModule } from './suppliers/suppliers.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { StockItemsModule } from './stock-items/stock-items.module';
import { UnitsModule } from './units/units.module';
import { StockMovementsModule } from './stock-movements/stock-movements.module';

@Module({
  imports: [
    SuppliersModule,
    PurchaseOrdersModule,
    StockItemsModule,
    UnitsModule,
    StockMovementsModule,
  ],
})
export class PurchaseModule {}
