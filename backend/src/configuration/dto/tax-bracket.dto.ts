import { IsDecimal, IsDate, IsOptional } from 'class-validator';

export class CreateTaxBracketDto {
  @IsDecimal({ decimal_digits: '1,2' })
  minSalary: number;

  @IsDecimal({ decimal_digits: '1,2' })
  @IsOptional()
  maxSalary?: number;

  @IsDecimal({ decimal_digits: '1,2' })
  rate: number;

  @IsDecimal({ decimal_digits: '1,2' })
  @IsOptional()
  deductible?: number;

  @IsDate()
  effectiveDate: Date;

  @IsDate()
  @IsOptional()
  expiryDate?: Date;
}

export class UpdateTaxBracketDto {
  @IsDecimal({ decimal_digits: '1,2' })
  @IsOptional()
  minSalary?: number;

  @IsDecimal({ decimal_digits: '1,2' })
  @IsOptional()
  maxSalary?: number;

  @IsDecimal({ decimal_digits: '1,2' })
  @IsOptional()
  rate?: number;

  @IsDecimal({ decimal_digits: '1,2' })
  @IsOptional()
  deductible?: number;

  @IsDate()
  @IsOptional()
  effectiveDate?: Date;

  @IsDate()
  @IsOptional()
  expiryDate?: Date;
}
