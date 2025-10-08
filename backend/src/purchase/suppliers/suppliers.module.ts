import { Module } from '@nestjs/common';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';

@Module({
  controllers: [SuppliersController],
  providers: [SuppliersService, PrismaService],
  exports: [SuppliersService], // Exporter le service pour qu'il soit utilisable ailleurs
})
export class SuppliersModule {}
