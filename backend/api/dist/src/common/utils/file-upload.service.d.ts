interface FileUploadOptions {
    subfolder?: string;
    privateSubsidiaryId?: string;
    maxSizeMb?: number;
    allowedMimes?: string[];
}
export declare class FileUploadService {
    private readonly publicPath;
    uploadFile(buffer: Buffer, originalFilename: string, options?: FileUploadOptions): Promise<{
        url: string;
        filename: string;
    }>;
    deleteFile(url: string): Promise<void>;
    private getMimeType;
}
export {};
