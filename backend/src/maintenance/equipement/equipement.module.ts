import { Module } from '@nestjs/common';
import { EquipementController } from './equipement.controller';
import { EquipementService } from './equipement.service';

@Module({
  controllers: [EquipementController],
  providers: [EquipementService],
})
export class EquipementModule {}
