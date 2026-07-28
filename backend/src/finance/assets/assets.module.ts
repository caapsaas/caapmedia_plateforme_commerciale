import { Module } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { TreasuryModule } from '../treasury/treasury.module';
import { AccountingOutboxModule } from '../../accounting/outbox/accounting-outbox.module';

@Module({
  imports: [TreasuryModule, AccountingOutboxModule],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
