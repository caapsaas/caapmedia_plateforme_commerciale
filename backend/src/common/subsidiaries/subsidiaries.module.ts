import { Module } from '@nestjs/common';
import { SubsidiariesService } from './subsidiaries/subsidiaries.service';
import { SubsidiariesController } from './subsidiaries/subsidiaries.controller';

@Module({
  providers: [SubsidiariesService],
  controllers: [SubsidiariesController]
})
export class SubsidiariesModule {}
