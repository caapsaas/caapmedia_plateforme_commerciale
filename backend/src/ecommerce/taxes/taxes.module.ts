import { Module } from '@nestjs/common';
import { TaxesService } from './taxes.service';
import { TaxesController } from './taxes.controller';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';

@Module({
  providers: [TaxesService,PrismaService],
  controllers: [TaxesController]
})
export class TaxesModule {}
