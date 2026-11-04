export declare enum PeriodFilter {
    ALL_TIME = "all_time",
    THIS_MONTH = "this_month",
    LAST_MONTH = "last_month",
    LAST_7_DAYS = "last_7_days",
    LAST_30_DAYS = "last_30_days",
    LAST_90_DAYS = "last_90_days",
    THIS_YEAR = "this_year",
    CUSTOM = "custom"
}
export declare class PeriodFilterDto {
    period: PeriodFilter;
    startDate?: string;
    endDate?: string;
}
