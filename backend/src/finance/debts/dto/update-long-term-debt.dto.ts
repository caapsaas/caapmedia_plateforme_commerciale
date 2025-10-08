import { IsNumber, IsPositive, IsOptional } from 'class-validator';

export class UpdateLongTermDebtDto {
  @IsNumber()
  @IsPositive()
  @IsOptional()
  currentBalance?: number;
}
