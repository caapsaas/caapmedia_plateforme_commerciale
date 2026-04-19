import { Module } from '@nestjs/common';
import { PrefinancementController } from './prefinancement.controller';
import { PrefinancementService } from './prefinancement.service';

@Module({
  controllers: [PrefinancementController],
  providers: [PrefinancementService],
  exports: [PrefinancementService],
})
export class PrefinancementModule {}
