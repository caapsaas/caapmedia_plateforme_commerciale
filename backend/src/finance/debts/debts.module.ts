import { Module, forwardRef } from '@nestjs/common';
import { DebtsService } from './debts.service';
import { DebtsController } from './debts.controller';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { TreasuryModule } from '../treasury/treasury.module';

@Module({
  imports: [forwardRef(() => TreasuryModule)], // Importation circulaire
  controllers: [DebtsController],
  providers: [DebtsService, PrismaService],
  exports: [DebtsService], // Exporter le service pour qu'il soit utilisable ailleurs
})
export class DebtsModule {}
