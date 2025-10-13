import { Module } from '@nestjs/common';
import { CrmtasksService } from './crmtasks.service';
import { CrmtasksController } from './crmtasks.controller';

@Module({
  providers: [CrmtasksService],
  controllers: [CrmtasksController]
})
export class CrmtasksModule {}
