import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { TaxesModule } from './taxes/taxes.module';
import { SalesModule } from './sales/sales.module';

@Module({
  imports: [ProductsModule, OrdersModule, TaxesModule, SalesModule]
})
export class EcommerceModule {}
