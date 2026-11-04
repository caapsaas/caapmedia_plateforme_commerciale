import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
export declare function r2Settings(env: Record<string, string | undefined>): {
    bucket: string;
    baseUrl: string;
    client: S3Client;
};
export declare const sha256: (body: Uint8Array) => string;
export declare function putVerified(settings: ReturnType<typeof r2Settings>, key: string, body: Buffer, contentType: string): Promise<string>;
export declare class ProductImageStorage {
    private readonly logger;
    private readonly settings?;
    constructor(config: ConfigService);
    upload(files?: Express.Multer.File[]): Promise<{
        imageName: string;
        imageUrl: string;
    }[]>;
    retainDetached(url: string): void;
}
