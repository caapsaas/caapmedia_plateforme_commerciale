import { ConfigModule } from '@nestjs/config';
import { ProductImageStorage } from './product-image-storage';
import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

@Module({
  imports: [ConfigModule],
  controllers: [ProductsController],
  providers: [ProductsService, ProductImageStorage],
})
export class ProductsModule {}
