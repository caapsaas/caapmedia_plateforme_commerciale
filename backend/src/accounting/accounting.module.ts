import { Module } from '@nestjs/common';

import { AccountsModule } from './accounts/accounts.module';
import { EntriesModule } from './entries/entries.module';
import { PeriodsModule } from './periods/periods.module';
import { ReportsModule } from './reports/reports.module';
import { JournalsModule } from './journals/journals.module';

@Module({
  imports: [
    AccountsModule,
    EntriesModule,
    PeriodsModule,
    ReportsModule,
    JournalsModule,
  ],
})
export class AccountingModule {}
