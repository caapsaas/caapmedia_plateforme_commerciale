import { DocumentCategory, DocumentStatus } from '@prisma/client';
import { PaginationQueryDto } from "../../common/pagination/dto/pagination-query.dto";
export declare class SearchCompanyDocumentsDto extends PaginationQueryDto {
    documentName?: string;
    category?: DocumentCategory;
    status?: DocumentStatus;
}
