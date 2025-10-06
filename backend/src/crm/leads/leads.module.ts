// src/crm/leads/leads.module.ts
import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { AccountsModule } from '../accounts/accounts.module';

@Module({
  imports: [AccountsModule],
  controllers: [LeadsController],
  providers: [LeadsService,PrismaService],
})
export class LeadsModule {}
