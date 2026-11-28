import { Module } from '@nestjs/common';
import { AccountingModule } from '../../accounting/accounting.module';
import { FinancialPilotageController } from './financial-pilotage.controller';
import { FinancialPilotageService } from './financial-pilotage.service';

@Module({
  imports: [AccountingModule],
  controllers: [FinancialPilotageController],
  providers: [FinancialPilotageService],
  exports: [FinancialPilotageService],
})
export class FinancialPilotageModule {}
