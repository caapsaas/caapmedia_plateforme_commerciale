import {
  IsString,
  IsNumber,
  IsPositive,
  IsDateString,
  IsOptional,
} from 'class-validator';

export class CreateCashRemittanceDto {
  @IsNumber()
  @IsPositive()
  declaredAmount: number;

  @IsDateString()
  remittanceDate: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
