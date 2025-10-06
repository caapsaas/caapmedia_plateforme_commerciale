// src/crm/leads/dto/create-lead.dto.ts
import { IsString, IsEmail, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { LeadStatus } from '@prisma/client';

export class CreateLeadDto {
  @IsString()
  @IsNotEmpty()
  leadName: string;

  @IsString()
  @IsNotEmpty()
  company: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(LeadStatus)
  @IsNotEmpty()
  status: LeadStatus;
}
