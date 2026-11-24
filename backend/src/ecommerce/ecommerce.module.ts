import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { ProductSpecsModule } from './products/product-specs/product-specs.module';
import { SpecReferenceListsModule } from './products/spec-reference-lists/spec-reference-lists.module';
import { OrdersModule } from './orders/orders.module';
import { TaxesModule } from './taxes/taxes.module';
import { SalesModule } from './sales/sales.module';
import { ProductionModule } from './production/production.module';
import { StorefrontContactModule } from './contact/contact.module';

@Module({
  imports: [
    ProductsModule,
    ProductSpecsModule,
    SpecReferenceListsModule,
    OrdersModule,
    TaxesModule,
    SalesModule,
    ProductionModule,
    StorefrontContactModule,
  ],
})
export class EcommerceModule {}
