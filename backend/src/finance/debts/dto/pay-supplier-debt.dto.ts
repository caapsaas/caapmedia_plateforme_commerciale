import { IsNotEmpty, IsDateString, IsString } from 'class-validator';

export class PaySupplierDebtDto {
  @IsString()
  @IsNotEmpty()
  treasuryAccountId: string;

  @IsDateString()
  @IsNotEmpty()
  paymentDate: string;
}
