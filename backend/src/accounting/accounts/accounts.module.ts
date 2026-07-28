import { Module } from '@nestjs/common';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { MappingsService } from './mappings.service';
import { MappingsController } from './mappings.controller';
import { JournalsModule } from '../journals/journals.module';
import { AccountingAccessModule } from 'src/accounting-access/accounting-access.module';

@Module({
  imports: [JournalsModule, AccountingAccessModule],
  controllers: [AccountsController, MappingsController],
  providers: [AccountsService, MappingsService],
  exports: [AccountsService, MappingsService],
})
export class AccountsModule {}
