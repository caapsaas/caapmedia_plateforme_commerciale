import { Module } from '@nestjs/common';
import { AnalyticsModule } from './analytics/analytics.module';
import { FinancesStatsModule } from './finances_stats/finances_stats.module';

@Module({
  imports: [AnalyticsModule, FinancesStatsModule],
})
export class StatisticsModule {}
