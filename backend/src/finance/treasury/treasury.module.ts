import { Module, forwardRef } from '@nestjs/common';
import { TreasuryService } from './treasury.service';
import { TreasuryController } from './treasury.controller';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { DebtsModule } from '../debts/debts.module';
import { AssetsModule } from '../assets/assets.module';


@Module({
  imports: [forwardRef(() => DebtsModule), forwardRef(() => AssetsModule)],
  controllers: [TreasuryController],
  providers: [TreasuryService, PrismaService],
  exports: [TreasuryService],
})
export class TreasuryModule {}
