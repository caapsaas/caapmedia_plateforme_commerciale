 import { Module } from '@nestjs/common';
 import { SubsidiariesService } from '../subsidiaries/subsidiaries/subsidiaries.service';
 import { SubsidiariesController } from '../subsidiaries/subsidiaries/subsidiaries.controller';
 import { UtilsModule } from '../utils/utils.module';
 
 @Module({
  imports: [UtilsModule], // <-- Ajout de UtilsModule ici
  controllers: [SubsidiariesController],
  providers: [SubsidiariesService],
 })
 export class SubsidiariesModule {}
