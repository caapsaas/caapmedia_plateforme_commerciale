import { Module } from '@nestjs/common';
import { ProductionWorkflowsService } from './production-workflows.service';
import { ProductionWorkflowsController } from './production-workflows.controller';

@Module({
  providers: [ProductionWorkflowsService],
  controllers: [ProductionWorkflowsController],
  exports: [ProductionWorkflowsService],
})
export class ProductionWorkflowsModule {}
