import {
  IsString,
  IsNumber,
  IsInt,
  IsDate,
  IsOptional,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAllowanceRuleDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  minAge?: number;

  @IsInt()
  @IsOptional()
  maxAge?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  minSalary?: number;

  @IsInt()
  @IsOptional()
  numberOfDependents?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  amount?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @IsOptional()
  percentageOfSalary?: number;

  @Type(() => Date)
  @IsDate()
  effectiveDate: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  expiryDate?: Date;
}

export class UpdateAllowanceRuleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  minAge?: number;

  @IsInt()
  @IsOptional()
  maxAge?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  minSalary?: number;

  @IsInt()
  @IsOptional()
  numberOfDependents?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  amount?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @IsOptional()
  percentageOfSalary?: number;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  effectiveDate?: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  expiryDate?: Date;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
