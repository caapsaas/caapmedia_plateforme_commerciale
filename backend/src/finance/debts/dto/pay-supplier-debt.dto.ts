import { IsNotEmpty, IsUUID, IsDateString } from 'class-validator';

export class PaySupplierDebtDto {
  @IsUUID()
  @IsNotEmpty()
  treasuryAccountId: string;

  @IsDateString()
  @IsNotEmpty()
  paymentDate: string;
}
