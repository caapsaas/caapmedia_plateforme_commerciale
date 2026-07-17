import { IsString, IsNotEmpty, IsDateString, IsNumber, IsPositive } from 'class-validator';

export class CreateSupplierDebtDto {
  @IsString()
  @IsNotEmpty()
  supplierName: string;

  @IsString()
  @IsNotEmpty()
  invoiceId: string;

  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsNotEmpty()
  purchaseOrderId: string;

  @IsString()
  @IsNotEmpty()
  invoiceUrl: string;
}
