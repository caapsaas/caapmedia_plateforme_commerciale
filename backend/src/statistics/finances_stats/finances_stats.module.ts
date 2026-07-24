import { Module } from '@nestjs/common';
import { FinancesStatsController } from './finances_stats.controller';
import { FinancesStatsService } from './finances_stats.service';

@Module({
  controllers: [FinancesStatsController],
  providers: [FinancesStatsService],
})
export class FinancesStatsModule {}
