import { Module } from '@nestjs/common';
import { MaintenanceRecordController } from './maintenance_record.controller';
import { MaintenanceRecordService } from './maintenance_record.service';

@Module({
  controllers: [MaintenanceRecordController],
  providers: [MaintenanceRecordService],
})
export class MaintenanceRecordModule {}
