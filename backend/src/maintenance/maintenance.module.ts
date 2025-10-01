import { Module } from '@nestjs/common';
import { EquipementModule } from './equipement/equipement.module';
import { MaintenanceRecordModule } from './maintenance_record/maintenance_record.module';
import { UtilsModule } from 'src/common/utils/utils.module';

@Module({
  imports: [EquipementModule, MaintenanceRecordModule, UtilsModule]
})
export class MaintenanceModule {}
