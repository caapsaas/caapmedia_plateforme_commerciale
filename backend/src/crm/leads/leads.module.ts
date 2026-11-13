// src/crm/leads/leads.module.ts
import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { ContactsModule } from '../contacts/contacts.module';

@Module({
  imports: [ContactsModule],
  controllers: [LeadsController],
  providers: [LeadsService],
})
export class LeadsModule {}
