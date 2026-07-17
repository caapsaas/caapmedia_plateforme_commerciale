import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsNumber,
  IsPositive,
} from 'class-validator';

export class CreateLongTermDebtDto {
  @IsString()
  @IsNotEmpty()
  debtsName: string;

  @IsNumber()
  @IsPositive()
  initialAmount: number;

  @IsNumber()
  @IsPositive()
  interestRate: number;

  @IsDateString()
  @IsNotEmpty()
  maturityDate: string;
}
