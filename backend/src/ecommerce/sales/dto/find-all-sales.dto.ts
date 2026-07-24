import { IsOptional, IsString, IsEnum } from 'class-validator';
import { CustomerPaymentMethod, SaleStatus } from '@prisma/client';

// Réutilisation de l'enum de période pour la cohérence
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

export class FindAllSalesDto {
  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  salesRepId?: string;

  @IsOptional()
  @IsEnum(CustomerPaymentMethod)
  paymentMethod?: CustomerPaymentMethod;

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
