import { Module } from '@nestjs/common';
import { ExpensesController } from './expense.controller';
import { ExpensesService } from './expense.service';
import { JournalizationModule } from '../../accounting/journalization/journalization.module';

@Module({
  imports: [JournalizationModule],
  controllers: [ExpensesController],
  providers: [ExpensesService],
})
export class ExpenseModule {}
