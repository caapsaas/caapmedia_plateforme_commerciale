import { Module } from '@nestjs/common';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { MappingsService } from './mappings.service';
import { MappingsController } from './mappings.controller';
import { JournalsModule } from '../journals/journals.module';

@Module({
  imports: [JournalsModule],
  controllers: [AccountsController, MappingsController],
  providers: [AccountsService, MappingsService],
  exports: [AccountsService, MappingsService],
})
export class AccountsModule {}
