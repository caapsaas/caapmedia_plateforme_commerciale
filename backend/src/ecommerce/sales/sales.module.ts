import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { UtilsModule } from 'src/common/utils/utils.module';

@Module({
  imports: [UtilsModule],
  controllers: [SalesController],
  providers: [SalesService, PrismaService],
})
export class SalesModule {}