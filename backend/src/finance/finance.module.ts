import { Module } from '@nestjs/common';
import { ExpenseModule } from './expense/expense.module';
import { TreasuryModule } from './treasury/treasury.module';
import { DebtsModule } from './debts/debts.module';
import { AssetsModule } from './assets/assets.module';

@Module({
  imports: [ExpenseModule, TreasuryModule, DebtsModule, AssetsModule]
})
export class FinanceModule {}
