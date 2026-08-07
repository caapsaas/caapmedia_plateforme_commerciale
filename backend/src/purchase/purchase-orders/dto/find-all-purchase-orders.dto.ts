import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentStatus, PurchaseOrderStatus } from '@prisma/client';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';

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

export class FindAllPurchaseOrdersDto extends PaginationQueryDto {
  // Subsidiary.id/Supplier.id sont des ids préfixés custom (SUB-xxx,
  // SUP-xxx), jamais des UUID — @IsUUID() cassait silencieusement le filtre
  // filiale/fournisseur du module Achats (échec 400 côté requête).
  @IsOptional()
  @IsString()
  subsidiaryId?: string;

  @IsOptional()
  @IsString()
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
