// src/crm/leads/leads.module.ts
import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { AccountsModule } from '../accounts/accounts.module';
import { ContactsModule } from '../contacts/contacts.module';

@Module({
  imports: [AccountsModule, ContactsModule], // Importer ContactsModule
  controllers: [LeadsController],
  providers: [LeadsService],
})
export class LeadsModule {}
