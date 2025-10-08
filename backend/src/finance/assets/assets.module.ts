import { Module, forwardRef } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { TreasuryModule } from '../treasury/treasury.module';

@Module({
  imports: [forwardRef(() => TreasuryModule)],
  controllers: [AssetsController],
  providers: [AssetsService, PrismaService],
  exports: [AssetsService],
})
export class AssetsModule {}
