import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map } from 'rxjs/operators';

// Covers nested relations too (e.g. sale.customer, task.contact).
export function redactPasswordHashes(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactPasswordHashes);
  if (
    value &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !['passwordHash', 'pinHash', 'pinCode'].includes(key))
        .map(([key, field]) => [key, redactPasswordHashes(field)]),
    );
  }
  return value;
}

@Injectable()
export class PasswordRedactionInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(map(redactPasswordHashes));
  }
}
