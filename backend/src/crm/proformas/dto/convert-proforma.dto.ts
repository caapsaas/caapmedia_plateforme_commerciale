import { plainToInstance, Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

class ConversionItemDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsOptional()
  @IsObject()
  specValues?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(0)
  designFileIndex?: number;
}

export class ConvertProformaDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  paymentDueDate: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConversionItemDto)
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    try {
      const items: unknown = JSON.parse(value);
      return Array.isArray(items)
        ? plainToInstance(ConversionItemDto, items)
        : value;
    } catch {
      return value;
    }
  })
  items?: ConversionItemDto[];
}
