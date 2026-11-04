import { DocumentCategory, DocumentStatus } from '@prisma/client';
export declare class CreateCompanyDocumentDto {
    documentName: string;
    category: DocumentCategory;
    status: DocumentStatus;
    subsidiaryId?: string;
}
