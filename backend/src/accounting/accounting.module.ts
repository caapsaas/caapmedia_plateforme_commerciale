import { Module } from '@nestjs/common';

import { AccountsModule } from './accounts/accounts.module';
import { EntriesModule } from './entries/entries.module';
import { PeriodsModule } from './periods/periods.module';
import { ReportsModule } from './reports/reports.module';
import { JournalsModule } from './journals/journals.module';
import { JournalizationModule } from './journalization/journalization.module';
import { AccountingOutboxModule } from './outbox/accounting-outbox.module';
import { AccountingSharedModule } from './shared/accounting-shared.module';
import { ImmobilisationsModule } from './immobilisations/immobilisations.module';

@Module({
  imports: [
    AccountsModule,
    EntriesModule,
    PeriodsModule,
    ReportsModule,
    JournalsModule,
    JournalizationModule,
    AccountingOutboxModule,
    AccountingSharedModule,
    ImmobilisationsModule,
  ],
  exports: [
    JournalizationModule,
    AccountingOutboxModule,
    AccountingSharedModule,
  ],
})
export class AccountingModule {}
