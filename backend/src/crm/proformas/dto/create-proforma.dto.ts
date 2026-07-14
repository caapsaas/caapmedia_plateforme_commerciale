import { IsString, IsUUID, IsNotEmpty, IsOptional, IsNumber, IsArray, ValidateNested, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

export class ProformaItemDto {
  @IsUUID()
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
  @IsUUID()
  @IsNotEmpty()
  leadId: string;

  @IsUUID()
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
