import { IsString, IsDate, IsEmail, IsEnum, IsDecimal, IsOptional, IsArray, Min, Max, Length, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { Gender, ContractType, EmployeeStatus, PaymentMethod } from '@prisma/client'; // Assumons que ces enums sont générés par Prisma

export class CreateEmployeeDto {
  @IsString()
  @Length(1, 100)
  lastName: string;

  @IsString()
  @Length(1, 100)
  firstName: string;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  birthDate: Date;

  @IsString()
  address: string;

  @IsString()
  @Length(1, 20)
  phone: string;

  @IsEmail()
  @Length(1, 150)
  email: string;

  @IsString()
  @Length(1, 50)
  nationality: string;

  @IsString()
  @Length(1, 50)
  socialSecurityNumber: string;

  @IsString()
  @Length(1, 100)
  positions: string;

  @IsString()
  @Length(1, 100)
  department: string;

  @IsDate()
  @Transform(({ value }) => new Date(value))
  hireDate: Date;

  @IsString()
  @Length(1, 100)
  workLocation: string;

  @IsDecimal()
  @Min(0)
  baseSalary: number;

  @IsDecimal()
  @Min(0)
  bonus: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  benefits?: string[];

  @IsEnum(Gender)
  gender: Gender;

  @IsEnum(ContractType)
  contractType: ContractType;

  @IsEnum(EmployeeStatus)
  status: EmployeeStatus;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod; // Devrait maintenant accepter VIREMENT_BANCAIRE

  @IsOptional()
  @IsUUID()
  managerId?: string;

  
  @IsOptional()
  @IsUUID()
  subsidiaryId?: string;

  // Champs omis : id, subsidiaryId (géré par auth/subsidiary), managerId (optionnel, à setter via update), etc.
  // leaveBalance est omis, géré automatiquement.
}

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {} // Pour les mises à jour partielles