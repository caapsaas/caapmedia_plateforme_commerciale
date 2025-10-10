import { Module } from '@nestjs/common';
import { FinancesStatsController } from './finances_stats.controller';
import { FinancesStatsService } from './finances_stats.service';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';

@Module({
  controllers: [FinancesStatsController],
  providers: [FinancesStatsService, PrismaService]
})
export class FinancesStatsModule {}
