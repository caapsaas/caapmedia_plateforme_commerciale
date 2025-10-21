import { Module } from '@nestjs/common';
import { LeadsModule } from './leads/leads.module';
import { AccountsModule } from './accounts/accounts.module';
import { ContactsModule } from './contacts/contacts.module';
import { OpportunitiesModule } from './opportunities/opportunities.module';
import { CrmtasksModule } from './crmtasks/crmtasks.module';
import { InteractionsModule } from './interractions/interractions.module';
import { ContractsModule } from './contracts/contracts.module';

@Module({
  imports: [LeadsModule, AccountsModule, ContactsModule, OpportunitiesModule, CrmtasksModule, ContractsModule, InteractionsModule]
})
export class CrmModule {}
