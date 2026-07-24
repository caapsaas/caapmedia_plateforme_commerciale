import { IsOptional, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { OrderStatus, PaymentStatus } from '@prisma/client';

export enum OrderPeriod {
  ALL_TIME = 'all_time',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  LAST_7_DAYS = 'last_7_days',
  LAST_30_DAYS = 'last_30_days',
  LAST_90_DAYS = 'last_90_days',
  THIS_YEAR = 'this_year',
  CUSTOM = 'custom',
}

export class FindAllOrdersDto {
  @IsOptional()
  @IsUUID()
  @Transform(({ value }) => value?.trim() || undefined)
  customerId?: string;

  @IsOptional()
  @IsUUID()
  @Transform(({ value }) => value?.trim() || undefined)
  productId?: string;

  @IsOptional()
  @IsUUID()
  @Transform(({ value }) => value?.trim() || undefined)
  subsidiaryId?: string;

  @IsOptional()
  @IsUUID()
  @Transform(({ value }) => value?.trim() || undefined)
  salesRepId?: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  orderStatus?: OrderStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsEnum(OrderPeriod)
  period?: OrderPeriod;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
