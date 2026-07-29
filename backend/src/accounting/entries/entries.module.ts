import { Module } from '@nestjs/common';
import { EntriesController } from './entries.controller';
import { EntriesService } from './entries.service';
import { AccountingAccessModule } from 'src/accounting-access/accounting-access.module';

@Module({
  imports: [AccountingAccessModule],
  controllers: [EntriesController],
  providers: [EntriesService],
  exports: [EntriesService],
})
export class EntriesModule {}
