import { Module } from '@nestjs/common';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';
import { UtilsModule } from 'src/common/utils/utils.module';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';

@Module({
  imports: [UtilsModule],
  controllers: [SuppliersController],
  providers: [SuppliersService, PrismaService]
})
export class SuppliersModule {}
