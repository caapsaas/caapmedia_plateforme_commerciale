import { Module } from '@nestjs/common';
import { TaxTransparencyController } from './tax-transparency.controller';
import { TaxTransparencyService } from './tax-transparency.service';

@Module({
  controllers: [TaxTransparencyController],
  providers: [TaxTransparencyService],
})
export class TaxTransparencyModule {}
