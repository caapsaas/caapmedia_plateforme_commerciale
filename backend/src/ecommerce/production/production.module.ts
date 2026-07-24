import { Module } from '@nestjs/common';
import { EquipmentCostConfigModule } from './equipment-cost-config/equipment-cost-config.module';
import { CommercialParamsModule } from './commercial-params/commercial-params.module';
import { ProductionWorkflowsModule } from './production-workflows/production-workflows.module';

@Module({
  imports: [
    EquipmentCostConfigModule,
    CommercialParamsModule,
    ProductionWorkflowsModule,
  ],
})
export class ProductionModule {}
