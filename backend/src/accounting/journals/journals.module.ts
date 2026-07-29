import { Module } from '@nestjs/common';
import { JournalsService } from './journals.service';
import { JournalsController } from './journals.controller';
import { AccountingAccessModule } from 'src/accounting-access/accounting-access.module';

@Module({
  imports: [AccountingAccessModule],
  providers: [JournalsService],
  controllers: [JournalsController],
  exports: [JournalsService],
})
export class JournalsModule {}
