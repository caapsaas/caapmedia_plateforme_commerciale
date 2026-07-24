import { IsString, IsNotEmpty, IsEnum, Length } from 'class-validator';
import { DocumentType } from '@prisma/client';

export class CreateEmployeeDocumentDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  documentName: string;

  @IsNotEmpty()
  @IsString()
  url: string;

  @IsNotEmpty()
  @IsEnum(DocumentType, { message: 'Invalid document type' })
  docType: DocumentType;
}
