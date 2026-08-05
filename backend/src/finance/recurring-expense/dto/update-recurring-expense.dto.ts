import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateRecurringExpenseDto } from './create-recurring-expense.dto';

export class UpdateRecurringExpenseDto extends PartialType(
  CreateRecurringExpenseDto,
) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
