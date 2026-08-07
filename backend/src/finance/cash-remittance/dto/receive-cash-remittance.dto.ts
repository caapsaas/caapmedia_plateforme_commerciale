import { IsString, IsNumber, IsPositive, IsOptional } from 'class-validator';

export class ReceiveCashRemittanceDto {
  @IsNumber()
  @IsPositive()
  receivedAmount: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
