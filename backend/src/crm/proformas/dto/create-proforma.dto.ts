import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProformaItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsNumber()
  @IsNotEmpty()
  unitPrice: number;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateProformaDto {
  @IsString()
  @IsNotEmpty()
  leadId: string;

  @IsString()
  @IsOptional()
  opportunityId?: string;

  @IsString()
  @IsNotEmpty()
  clientName: string;

  @IsEmail()
  @IsNotEmpty()
  clientEmail: string;

  @IsString()
  @IsNotEmpty()
  clientPhone: string;

  @IsString()
  @IsOptional()
  clientCompany?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProformaItemDto)
  @IsNotEmpty()
  items: ProformaItemDto[];

  @IsNumber()
  @IsOptional()
  @IsNotEmpty()
  taxRate: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsNumber()
  @IsOptional()
  validityDays?: number;
}
