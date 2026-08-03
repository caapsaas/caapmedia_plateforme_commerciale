import { IsString, IsEnum, IsOptional } from 'class-validator';
import { DocumentCategory, DocumentStatus } from '@prisma/client';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';

export class SearchCompanyDocumentsDto extends PaginationQueryDto {
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
