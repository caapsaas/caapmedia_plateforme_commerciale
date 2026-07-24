import { Module } from '@nestjs/common';
import { ProductSpecsController } from './product-specs.controller';
import { ProductSpecsService } from './product-specs.service';

@Module({
  controllers: [ProductSpecsController],
  providers: [ProductSpecsService],
  exports: [ProductSpecsService],
})
export class ProductSpecsModule {}
