import { Module } from '@nestjs/common';
import { JournalizationService } from './journalization.service';
import { AccountsModule } from '../accounts/accounts.module';
import { JournalsModule } from '../journals/journals.module';
import { PeriodsModule } from '../periods/periods.module';

@Module({
  imports: [AccountsModule, JournalsModule, PeriodsModule],
  providers: [JournalizationService],
  exports: [JournalizationService],
})
export class JournalizationModule {}
