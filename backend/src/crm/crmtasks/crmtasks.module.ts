import { Module } from '@nestjs/common';
import { CrmtasksService } from './crmtasks.service';
import { CrmtasksController } from './crmtasks.controller';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';

@Module({
  providers: [CrmtasksService, PrismaService],
  controllers: [CrmtasksController]
})
export class CrmtasksModule {}
