import { Module } from '@nestjs/common';
import { ExpenseModule } from './expense/expense.module';
import { RecurringExpenseModule } from './recurring-expense/recurring-expense.module';
import { TaxTransparencyModule } from './tax-transparency/tax-transparency.module';
import { TreasuryModule } from './treasury/treasury.module';
import { BankModule } from './bank/bank.module';
import { CashRemittanceModule } from './cash-remittance/cash-remittance.module';
import { DebtsModule } from './debts/debts.module';
import { AssetsModule } from './assets/assets.module';
import { ExternalTransactionModule } from './external-transaction/external-transaction.module';
import { FinancialPilotageModule } from './pilotage/financial-pilotage.module';
import { PrefinancementModule } from './prefinancement/prefinancement.module';
import { JournalizationModule } from '../accounting/journalization/journalization.module';

@Module({
  imports: [
    ExpenseModule,
    RecurringExpenseModule,
    TaxTransparencyModule,
    TreasuryModule,
    BankModule,
    CashRemittanceModule,
    DebtsModule,
    AssetsModule,
    ExternalTransactionModule,
    FinancialPilotageModule,
    PrefinancementModule,
    JournalizationModule,
  ],
})
export class FinanceModule {}
