import { Module } from '@nestjs/common';
import { EquipmentCostConfigService } from './equipment-cost-config.service';
import { EquipmentCostConfigController } from './equipment-cost-config.controller';

@Module({
  providers: [EquipmentCostConfigService],
  controllers: [EquipmentCostConfigController],
  exports: [EquipmentCostConfigService],
})
export class EquipmentCostConfigModule {}
