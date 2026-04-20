import { Module } from '@nestjs/common';
import { PrefinancementController } from './prefinancement.controller';
import { PrefinancementService } from './prefinancement.service';
import { TreasuryModule } from '../treasury/treasury.module';

@Module({
  imports: [TreasuryModule],
  controllers: [PrefinancementController],
  providers: [PrefinancementService],
  exports: [PrefinancementService],
})
export class PrefinancementModule {}
