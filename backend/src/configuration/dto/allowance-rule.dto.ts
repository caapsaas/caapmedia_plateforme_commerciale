import {
  IsString,
  IsDecimal,
  IsInt,
  IsDate,
  IsOptional,
  IsBoolean,
} from 'class-validator';

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

  @IsDecimal({ decimal_digits: '1,2' })
  @IsOptional()
  minSalary?: number;

  @IsInt()
  @IsOptional()
  numberOfDependents?: number;

  @IsDecimal({ decimal_digits: '1,2' })
  @IsOptional()
  amount?: number;

  @IsDecimal({ decimal_digits: '1,2' })
  @IsOptional()
  percentageOfSalary?: number;

  @IsDate()
  effectiveDate: Date;

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

  @IsDecimal({ decimal_digits: '1,2' })
  @IsOptional()
  minSalary?: number;

  @IsInt()
  @IsOptional()
  numberOfDependents?: number;

  @IsDecimal({ decimal_digits: '1,2' })
  @IsOptional()
  amount?: number;

  @IsDecimal({ decimal_digits: '1,2' })
  @IsOptional()
  percentageOfSalary?: number;

  @IsDate()
  @IsOptional()
  effectiveDate?: Date;

  @IsDate()
  @IsOptional()
  expiryDate?: Date;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
