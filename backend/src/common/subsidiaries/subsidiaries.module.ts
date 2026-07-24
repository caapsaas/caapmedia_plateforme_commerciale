import { Module } from '@nestjs/common';
import { SubsidiaryService } from '../subsidiaries/subsidiaries/subsidiaries.service';
import { SubsidiaryController } from '../subsidiaries/subsidiaries/subsidiaries.controller';
import { UtilsModule } from '../utils/utils.module';

@Module({
  imports: [UtilsModule], // <-- Ajout de UtilsModule ici
  controllers: [SubsidiaryController],
  providers: [SubsidiaryService],
})
export class SubsidiariesModule {}
