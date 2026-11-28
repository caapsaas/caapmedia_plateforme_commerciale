import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateSupplierCreditNoteDto {
  @IsString()
  @IsNotEmpty()
  supplierDebtId: string;

  @IsString()
  @IsNotEmpty()
  creditNoteNumber: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsDateString()
  @IsOptional()
  issuedAt?: string;

  @IsString()
  @IsOptional()
  proofFilePath?: string;
}
