import {
  IsString,
  IsArray,
  ArrayUnique,
  IsNumber,
  IsPositive,
  IsDateString,
  IsOptional,
} from 'class-validator';

export class CreateCashRemittanceDto {
  @IsOptional()
  @IsString()
  sourceCashRegisterId?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  declaredAmount: number;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  receiptIds?: string[];

  // Journée des encaissements. Les anciens clients envoient un horodatage ISO.
  @IsDateString({ strict: true })
  remittanceDate: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
