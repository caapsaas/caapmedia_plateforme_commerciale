import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsEnum,
  IsString,
  IsUUID,
  IsNumber,
  Min,
  ValidateNested,
} from 'class-validator';
import { CustomerPaymentMethod } from '@prisma/client';

class DirectSaleItemDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  productName: string;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  unitPrice: number;
}

export class CreateDirectSaleDto {
  @IsNotEmpty()
  @IsUUID()
  customerId: string;

  @IsNotEmpty()
  @IsEnum(CustomerPaymentMethod)
  paymentMethod: CustomerPaymentMethod;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DirectSaleItemDto)
  items: DirectSaleItemDto[];
}