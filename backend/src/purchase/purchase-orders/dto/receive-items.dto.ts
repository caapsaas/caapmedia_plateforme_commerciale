import { Type } from 'class-transformer';
import {
  IsArray,
  IsDefined,
  IsInt,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class ReceiveItemDto {
  @IsString()
  purchaseOrderItemId: string;

  @IsInt()
  @Min(1)
  quantityReceived: number;
}

export class ReceiveItemsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiveItemDto)
  @IsDefined()
  items: ReceiveItemDto[];
}