import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
export declare const ORDER_FILE_LIMIT: number;
export declare function validateDesignHeader(extension: string, header: Buffer): void;
export declare class OrderDesignUploadInterceptor implements NestInterceptor {
    private readonly multipart;
    intercept(context: ExecutionContext, next: CallHandler): Promise<import("rxjs").Observable<any>>;
}
