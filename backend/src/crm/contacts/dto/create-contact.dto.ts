import {
    IsString,
    IsNotEmpty,
    IsEmail,
    IsOptional,
    IsUUID,
    IsEnum,
  } from 'class-validator';
  import { ContactStatus } from '@prisma/client';
  
  export class CreateContactDto {
    @IsString()
    @IsNotEmpty()
    contactName: string;
  
    @IsString()
    @IsNotEmpty()
    company: string;
  
    @IsEmail()
    @IsNotEmpty()
    email: string;
  
    @IsString()
    @IsNotEmpty()
    phone: string;
  
    @IsString()
    @IsNotEmpty()
    address: string;
  
    @IsEnum(ContactStatus)
    @IsOptional()
    status?: ContactStatus;
  
    @IsUUID()
    @IsOptional()
    accountId?: string;

    @IsUUID()
    @IsOptional()
    subsidiaryId?: string;
  }
  