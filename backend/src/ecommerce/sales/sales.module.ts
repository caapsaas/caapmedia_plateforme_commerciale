import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { ProductSpecsModule } from '../products/product-specs/product-specs.module';

@Module({
  imports: [ProductSpecsModule],
  controllers: [SalesController],
  providers: [SalesService],
})
export class SalesModule {}
