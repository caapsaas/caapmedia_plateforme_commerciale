import type { Request } from 'express';
export declare const PRIVATE_DOCUMENT_ROOT: string;
export declare const PRIVATE_DOCUMENT_PREFIX = "/api-caapmedia/private-documents/";
export declare function secretariatDestination(_req: Request, _file: Express.Multer.File, callback: (error: Error | null, destination: string) => void): void;
