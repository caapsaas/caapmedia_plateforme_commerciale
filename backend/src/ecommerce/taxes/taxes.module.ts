import { Module } from '@nestjs/common';
import { TaxesService } from './taxes.service';
import { TaxesController } from './taxes.controller';
import { UtilsModule } from 'src/common/utils/utils.module';

@Module({
  imports: [UtilsModule],
  providers: [TaxesService],
  controllers: [TaxesController]
})
export class TaxesModule {}
