import { IsString, IsEnum, IsOptional } from 'class-validator';
import { DocumentCategory, DocumentStatus } from '@prisma/client';

export class SearchCompanyDocumentsDto {
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
