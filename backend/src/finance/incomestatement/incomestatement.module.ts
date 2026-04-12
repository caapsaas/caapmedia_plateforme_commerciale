import { Module } from '@nestjs/common';
import { IncomestatementService } from './incomestatement.service';
import { IncomestatementController } from './incomestatement.controller';

@Module({
  providers: [IncomestatementService],
  controllers: [IncomestatementController]
})
export class IncomestatementModule {}
