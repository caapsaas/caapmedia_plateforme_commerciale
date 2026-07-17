import {
  IsString,
  IsEnum,
  IsOptional,
  IsNotEmpty,
  IsUUID,
  IsDateString,
  IsArray,
} from 'class-validator';
import {
  DocumentCategory,
  DocumentStatus,
  SecretariatTaskStatus,
} from '@prisma/client';

export class UpdateCompanyDocumentDto {
  @IsOptional()
  @IsString()
  documentName?: string;

  @IsOptional()
  @IsEnum(DocumentCategory)
  category?: DocumentCategory;

  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;
}
