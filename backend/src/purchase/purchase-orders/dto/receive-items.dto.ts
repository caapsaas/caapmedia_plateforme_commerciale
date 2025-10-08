import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

class ReceiveItemDto {
  @IsUUID()
  purchaseOrderItemId: string;

  @IsInt()
  @Min(1)
  quantityReceived: number;
}

export class ReceiveItemsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiveItemDto)
  items: ReceiveItemDto[];
}