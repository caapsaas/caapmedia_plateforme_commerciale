import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateLeaveBalanceDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  days: number;

  @IsOptional()
  @IsIn(['set', 'add', 'subtract'])
  operation?: 'set' | 'add' | 'subtract';
}
