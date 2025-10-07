import { Module } from '@nestjs/common';
import { TaxesService } from './taxes.service';
import { TaxesController } from './taxes.controller';
import { UtilsModule } from 'src/common/utils/utils.module';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';

@Module({
  imports: [UtilsModule],
  providers: [TaxesService,PrismaService],
  controllers: [TaxesController]
})
export class TaxesModule {}
