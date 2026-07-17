import { Type } from 'class-transformer';
import {
  IsArray,
  IsDefined,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';

class ReceiveItemDto {
  @IsInt()
  purchaseOrderItemId: number;

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
