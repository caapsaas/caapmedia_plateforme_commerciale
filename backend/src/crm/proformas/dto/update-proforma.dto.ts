import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProformaItemDto } from './create-proforma.dto';

export class UpdateProformaDto {
  @IsString()
  @IsOptional()
  clientName?: string;

  @IsEmail()
  @IsOptional()
  clientEmail?: string;

  @IsString()
  @IsOptional()
  clientPhone?: string;

  @IsString()
  @IsOptional()
  clientCompany?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProformaItemDto)
  @IsOptional()
  items?: ProformaItemDto[];

  @IsNumber()
  @IsOptional()
  taxRate?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
