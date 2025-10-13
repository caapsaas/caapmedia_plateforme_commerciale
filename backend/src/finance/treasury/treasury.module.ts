import { Module, forwardRef } from '@nestjs/common';
import { TreasuryService } from './treasury.service';
import { TreasuryController } from './treasury.controller';
import { DebtsModule } from '../debts/debts.module';
import { AssetsModule } from '../assets/assets.module';


@Module({
  imports: [forwardRef(() => DebtsModule), forwardRef(() => AssetsModule)],
  controllers: [TreasuryController],
  providers: [TreasuryService],
  exports: [TreasuryService],
})
export class TreasuryModule {}
