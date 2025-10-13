// backend/src/analytics/dto/period-filter.dto.ts
import { IsEnum, IsOptional, IsDateString, ValidateIf } from 'class-validator';

export enum PeriodFilter {
  ALL_TIME = 'all_time',
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  LAST_7_DAYS = 'last_7_days',
  LAST_30_DAYS = 'last_30_days',
  LAST_90_DAYS = 'last_90_days',
  THIS_YEAR = 'this_year',
  CUSTOM = 'custom',
}

export class PeriodFilterDto {
  @IsEnum(PeriodFilter)
  @IsOptional()
  period: PeriodFilter = PeriodFilter.THIS_MONTH;

  @ValidateIf(o => o.period === PeriodFilter.CUSTOM)
  @IsDateString()
  startDate?: string;

  @ValidateIf(o => o.period === PeriodFilter.CUSTOM)
  @IsDateString()
  endDate?: string;
}