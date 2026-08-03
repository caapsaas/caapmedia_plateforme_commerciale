import {
  IsString,
  IsDate,
  IsEnum,
  IsDecimal,
  Min,
  IsOptional,
  Length,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { PayrollStatus } from '@prisma/client';

export class CreatePayrollRecordDto {
  @IsString()
  @Length(1, 255)
  employeeName: string;

  @IsString()
  @Length(1, 255)
  employeeId: string;

  @IsString()
  @Length(1, 7) // Format YYYY-MM
  payrollPeriod: string;

  @IsOptional()
  @IsDecimal()
  @Min(0)
  baseSalary?: number;

  @IsOptional()
  @IsDecimal()
  @Min(0)
  bonus?: number;

  @IsOptional()
  @IsDecimal()
  @Min(0)
  allowances?: number;

  @IsOptional()
  @IsDecimal()
  @Min(0)
  overtime?: number;

  @IsOptional()
  @IsDecimal()
  @Min(0)
  otherEarnings?: number;

  @IsOptional()
  @IsDecimal()
  @Min(0)
  grossSalary?: number;

  @IsOptional()
  @IsDecimal()
  @Min(0)
  cnpsEmployee?: number;

  @IsOptional()
  @IsDecimal()
  @Min(0)
  cfcEmployee?: number;

  @IsOptional()
  @IsDecimal()
  @Min(0)
  irpp?: number;

  @IsOptional()
  @IsDecimal()
  @Min(0)
  cac?: number;

  @IsOptional()
  @IsDecimal()
  @Min(0)
  otherDeductions?: number;

  @IsOptional()
  @IsDecimal()
  @Min(0)
  deductions?: number;

  @IsOptional()
  @IsDecimal()
  @Min(0)
  cnpsEmployer?: number;

  @IsOptional()
  @IsDecimal()
  @Min(0)
  cfcEmployer?: number;

  @IsOptional()
  @IsDecimal()
  @Min(0)
  fne?: number;

  @IsOptional()
  @IsDecimal()
  @Min(0)
  totalEmployerCost?: number;

  @IsOptional()
  @IsDecimal()
  @Min(0)
  netSalary?: number;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => (value ? new Date(value) : null))
  paymentDate?: Date;

  @IsOptional()
  @IsString()
  signature?: string;

  @IsOptional()
  deductionsDetail?: {
    label: string;
    amount: number;
    type?: 'STATUTORY' | 'VOLUNTARY' | 'ADVANCE' | 'OTHER';
  }[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsEnum(PayrollStatus)
  status: PayrollStatus;
}

export class UpdatePayrollRecordDto extends PartialType(
  CreatePayrollRecordDto,
) {}
