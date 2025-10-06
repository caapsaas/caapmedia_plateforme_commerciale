import { Module } from '@nestjs/common';
import { OpportunitiesService } from './opportunities.service';
import { OpportunitiesController } from './opportunities.controller';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';

@Module({
  controllers: [OpportunitiesController],
  providers: [OpportunitiesService,PrismaService],
})
export class OpportunitiesModule {}
