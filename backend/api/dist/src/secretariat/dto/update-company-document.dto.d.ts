import { DocumentCategory, DocumentStatus } from '@prisma/client';
export declare class UpdateCompanyDocumentDto {
    documentName?: string;
    category?: DocumentCategory;
    status?: DocumentStatus;
}
