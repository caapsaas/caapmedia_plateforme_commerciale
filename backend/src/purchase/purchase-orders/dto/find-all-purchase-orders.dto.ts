import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaymentStatus, PurchaseOrderStatus } from '@prisma/client';

// Réutilisation de l'enum de période pour la cohérence
export enum OrderPeriod {
  ALL_TIME = 'all_time',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  LAST_7_DAYS = 'last_7_days',
  LAST_30_DAYS = 'last_30_days',
  THIS_YEAR = 'this_year',
  CUSTOM = 'custom',
}

export class FindAllPurchaseOrdersDto {
  @IsOptional()
  @IsUUID()
  subsidiaryId?: string;

  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsEnum(PurchaseOrderStatus)
  status?: PurchaseOrderStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsEnum(OrderPeriod)
  period?: OrderPeriod;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
