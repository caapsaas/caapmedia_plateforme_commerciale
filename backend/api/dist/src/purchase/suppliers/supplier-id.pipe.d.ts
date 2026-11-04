import { PipeTransform } from '@nestjs/common';
export declare class SupplierIdPipe implements PipeTransform<string, string> {
    transform(value: string): string;
}
