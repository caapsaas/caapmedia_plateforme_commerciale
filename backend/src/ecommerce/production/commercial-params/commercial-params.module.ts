import { Module } from '@nestjs/common';
import { CommercialParamsService } from './commercial-params.service';
import { CommercialParamsController } from './commercial-params.controller';

@Module({
  providers: [CommercialParamsService],
  controllers: [CommercialParamsController],
  exports: [CommercialParamsService],
})
export class CommercialParamsModule {}
