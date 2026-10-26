import {
  IsString,
  IsNumber,
  Min,
  Max,
  IsInt,
  IsEnum,
  IsOptional,
  IsBoolean,
} from 'class-validator';

enum SalaryComponentType {
  EARNING = 'EARNING',
  DEDUCTION = 'DEDUCTION',
  TAX = 'TAX',
  CONTRIBUTION = 'CONTRIBUTION',
}

enum ContributionType {
  EMPLOYEE = 'EMPLOYEE',
  EMPLOYER = 'EMPLOYER',
  BOTH = 'BOTH',
}

export class CreateSalaryComponentDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(SalaryComponentType)
  type: SalaryComponentType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @IsOptional()
  rate?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  fixedAmount?: number;

  @IsEnum(ContributionType)
  @IsOptional()
  contributionType?: ContributionType;

  @IsInt()
  @IsOptional()
  displayOrder?: number;
}

export class UpdateSalaryComponentDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(SalaryComponentType)
  @IsOptional()
  type?: SalaryComponentType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @IsOptional()
  rate?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  fixedAmount?: number;

  @IsEnum(ContributionType)
  @IsOptional()
  contributionType?: ContributionType;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @IsOptional()
  displayOrder?: number;
}
