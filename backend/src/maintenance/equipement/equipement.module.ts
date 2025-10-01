import { Module } from '@nestjs/common';
import { EquipementController } from './equipement.controller';
import { EquipementService } from './equipement.service';
import { UtilsModule } from 'src/common/utils/utils.module';

@Module({
  imports: [UtilsModule],
  controllers: [EquipementController],
  providers: [EquipementService]
})
export class EquipementModule {}
