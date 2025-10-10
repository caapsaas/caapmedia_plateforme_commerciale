import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../common/utils/prisma/prisma.service';
@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, PrismaService]
})
export class AnalyticsModule {}
