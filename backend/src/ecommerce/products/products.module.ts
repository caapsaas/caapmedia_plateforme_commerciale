import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { UtilsModule } from 'src/common/utils/utils.module';

@Module({
  imports: [UtilsModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
