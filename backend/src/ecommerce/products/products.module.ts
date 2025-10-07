import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { UtilsModule } from 'src/common/utils/utils.module';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';

@Module({
  imports: [UtilsModule],
  controllers: [ProductsController],
  providers: [ProductsService,PrismaService ],
})
export class ProductsModule {}
