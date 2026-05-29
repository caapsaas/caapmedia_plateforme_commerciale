import { Module } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { TreasuryModule } from '../treasury/treasury.module';
import { JournalizationModule } from '../../accounting/journalization/journalization.module';

@Module({
  imports: [TreasuryModule, JournalizationModule],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
