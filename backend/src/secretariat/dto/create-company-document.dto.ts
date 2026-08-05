import { IsString, IsEnum, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';
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
  @IsUUID('all')
  subsidiaryId?: string;
}
