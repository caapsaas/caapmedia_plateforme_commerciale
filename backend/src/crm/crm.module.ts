import { Module } from '@nestjs/common';
import { LeadsModule } from './leads/leads.module';
import { AccountsModule } from './accounts/accounts.module';
import { ContactsModule } from './contacts/contacts.module';
import { OpportunitiesModule } from './opportunities/opportunities.module';
import { CrmtasksModule } from './crmtasks/crmtasks.module';

@Module({
  imports: [LeadsModule, AccountsModule, ContactsModule, OpportunitiesModule, CrmtasksModule]
})
export class CrmModule {}
