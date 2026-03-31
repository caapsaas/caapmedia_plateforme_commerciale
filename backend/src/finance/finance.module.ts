import { Module } from '@nestjs/common';
import { ExpenseModule } from './expense/expense.module';
import { TreasuryModule } from './treasury/treasury.module';
import { DebtsModule } from './debts/debts.module';
import { AssetsModule } from './assets/assets.module';
import { ExternalTransactionModule } from './external-transaction/external-transaction.module';

@Module({
  imports: [ExpenseModule, TreasuryModule, DebtsModule, AssetsModule, ExternalTransactionModule]
})
export class FinanceModule {}
