import { IsString, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { DocumentCategory, DocumentStatus } from '@prisma/client';

export class CreateCompanyDocumentDto {
  @IsNotEmpty()
  @IsString()
  documentName: string;

  @IsEnum(DocumentCategory)
  category: DocumentCategory;

  @IsEnum(DocumentStatus)
  status: DocumentStatus;

  @IsOptional()
  @IsString()
  subsidiaryId?: string;
}
