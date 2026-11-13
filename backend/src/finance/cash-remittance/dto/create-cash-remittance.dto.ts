import {
  IsString,
  IsNumber,
  IsPositive,
  IsDateString,
  IsOptional,
  IsArray,
  ArrayMinSize,
  ArrayUnique,
} from 'class-validator';

export class CreateCashRemittanceDto {
  @IsOptional()
  @IsString()
  sourceCashRegisterId?: string;

  // Le backend recalcule ce montant à partir des commandes sélectionnées.
  @IsOptional()
  @IsNumber()
  @IsPositive()
  declaredAmount?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsString({ each: true })
  receiptIds: string[];

  @IsDateString()
  remittanceDate: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
