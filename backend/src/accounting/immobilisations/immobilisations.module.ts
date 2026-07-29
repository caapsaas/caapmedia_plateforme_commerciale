import { Module } from '@nestjs/common';
import { ImmobilisationsService } from './immobilisations.service';
import { ImmobilisationsController } from './immobilisations.controller';
import { EntriesModule } from '../entries/entries.module';
import { AccountsModule } from '../accounts/accounts.module';
import { AccountingAccessModule } from 'src/accounting-access/accounting-access.module';

@Module({
  imports: [EntriesModule, AccountsModule, AccountingAccessModule],
  controllers: [ImmobilisationsController],
  providers: [ImmobilisationsService],
  exports: [ImmobilisationsService],
})
export class ImmobilisationsModule {}
