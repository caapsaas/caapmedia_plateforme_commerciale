import { IsNumber, IsDate, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTaxBracketDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minSalary: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  maxSalary?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  rate: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  deductible?: number;

  @Type(() => Date)
  @IsDate()
  effectiveDate: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  expiryDate?: Date;
}

export class UpdateTaxBracketDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  minSalary?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  maxSalary?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @IsOptional()
  rate?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  deductible?: number;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  effectiveDate?: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  expiryDate?: Date;
}
