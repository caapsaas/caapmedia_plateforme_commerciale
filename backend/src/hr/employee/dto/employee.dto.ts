import {
  IsString,
  IsDate,
  IsEmail,
  IsEnum,
  IsOptional,
  IsArray,
  Min,
  Length,
  IsNumber,
  ValidateNested,
  IsNotEmpty,
  Matches,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { Gender, ContractType, EmployeeStatus, PaymentMethod, LeaveType, DocumentType } from '@prisma/client';
import { IsMinAge } from '../../../common/validators/age-validation.validator';
import { IsEndDateAfterStartDate } from '../../../common/validators/end-date-after-start-date.validator';

export class LeaveBalanceDto {
  @IsNumber()
  @Min(0)
  annual: number;

  @IsNumber()
  @Min(0)
  sick: number;

  @IsNumber()
  @Min(0)
  personal: number;

  @IsNumber()
  @Min(0)
  maternity: number;

  @IsNumber()
  @Min(0)
  paternity: number;

  @IsNumber()
  @Min(0)
  other: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unpaid?: number;
}

export class LeaveRecordDto {
  @IsNotEmpty()
  @IsEnum(LeaveType)
  leaveRecordType: LeaveType;

  @IsNotEmpty()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  startDate: Date;

  @IsNotEmpty()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  endDate: Date;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  days: number;
}

export class SingleDocumentDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  url: string;
}

export class EmployeeDocumentsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => SingleDocumentDto)
  contract?: SingleDocumentDto | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => SingleDocumentDto)
  idCard?: SingleDocumentDto | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => SingleDocumentDto)
  workPermit?: SingleDocumentDto | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SingleDocumentDto)
  diplomas?: SingleDocumentDto[];
}

export class CreateEmployeeDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  lastName: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  firstName: string;

  @IsNotEmpty()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  @IsMinAge(16, { message: 'Employee must be at least 16 years old' })
  birthDate: Date;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[+]?[0-9\s\-()]{7,20}$/, { message: 'Invalid phone number format' })
  phone: string;

  @IsNotEmpty()
  @IsEmail()
  @Length(1, 150)
  email: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 50)
  nationality: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 50)
  socialSecurityNumber: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  positions: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  department: string;

  @IsNotEmpty()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  @IsEndDateAfterStartDate('birthDate', { message: 'Hire date must be after birth date' })
  hireDate: Date;

  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  workLocation: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  baseSalary: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  bonus: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  benefits?: string[];

  @IsNotEmpty()
  @IsEnum(Gender)
  gender: Gender;

  @IsNotEmpty()
  @IsEnum(ContractType)
  contractType: ContractType;

  @IsNotEmpty()
  @IsEnum(EmployeeStatus)
  status: EmployeeStatus;

  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  // Banking Information (optional)
  @IsOptional()
  @IsString()
  @Length(1, 100)
  bankName?: string;

  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @IsOptional()
  @IsString()
  managerId?: string;

  @IsOptional()
  @IsString()
  subsidiaryId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LeaveBalanceDto)
  leaveBalance?: LeaveBalanceDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LeaveRecordDto)
  leaveRecords?: LeaveRecordDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => EmployeeDocumentsDto)
  documents?: EmployeeDocumentsDto;

  // Personal information fields
  @IsOptional()
  @IsNumber()
  @Min(0)
  numberDependents?: number;

  @IsOptional()
  @IsEnum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'], {
    message: 'Situation must be SINGLE, MARRIED, DIVORCED, or WIDOWED',
  })
  situationMatrimony?: string;

  // Cameroon-specific fields
  @IsOptional()
  @IsString()
  @Length(1, 20)
  cnpsNumber?: string;

  @IsOptional()
  @IsString()
  cnpsNumberEncrypted?: string;

  @IsOptional()
  @IsString()
  @Length(1, 1)
  categoryCodeCNPS?: string;

  @IsOptional()
  @IsString()
  @Length(1, 15)
  taxIdNTif?: string;
}

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {} // Pour les mises à jour partielles