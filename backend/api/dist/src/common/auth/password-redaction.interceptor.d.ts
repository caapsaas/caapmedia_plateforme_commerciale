import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
export declare function redactPasswordHashes(value: unknown): unknown;
export declare class PasswordRedactionInterceptor implements NestInterceptor {
    intercept(_context: ExecutionContext, next: CallHandler): import("rxjs").Observable<unknown>;
}
