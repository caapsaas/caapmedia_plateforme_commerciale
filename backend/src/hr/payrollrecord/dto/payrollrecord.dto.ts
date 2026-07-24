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

  @IsDecimal()
  @Min(0)
  grossSalary: number;

  @IsDecimal()
  @Min(0)
  deductions: number;

  @IsDecimal()
  @Min(0)
  netSalary: number;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => (value ? new Date(value) : null))
  paymentDate?: Date;

  @IsOptional()
  @IsString()
  signature?: string;

  @IsEnum(PayrollStatus)
  status: PayrollStatus;
}

export class UpdatePayrollRecordDto extends PartialType(
  CreatePayrollRecordDto,
) {}
