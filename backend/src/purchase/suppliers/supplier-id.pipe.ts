import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { isUUID } from 'class-validator';

@Injectable()
export class SupplierIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!isUUID(value) && !/^SUP-[A-Z0-9]+$/.test(value)) {
      throw new BadRequestException('Identifiant fournisseur invalide.');
    }
    return value;
  }
}
