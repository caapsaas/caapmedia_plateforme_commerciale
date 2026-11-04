import type { Request as ExpressRequest, Response } from 'express';
import { PrivateDocumentsService } from './private-documents.service';
export declare class PrivateDocumentsController {
    private readonly documents;
    constructor(documents: PrivateDocumentsService);
    download(params: {
        category: string;
        filename: string;
        subsidiaryId?: string;
    }, req: ExpressRequest, res: Response): Promise<void>;
}
