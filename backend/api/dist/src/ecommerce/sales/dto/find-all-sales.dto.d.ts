import { CustomerPaymentMethod } from '@prisma/client';
import { PaginationQueryDto } from "../../../common/pagination/dto/pagination-query.dto";
export declare enum OrderPeriod {
    ALL_TIME = "all_time",
    THIS_MONTH = "this_month",
    LAST_MONTH = "last_month",
    LAST_7_DAYS = "last_7_days",
    LAST_30_DAYS = "last_30_days",
    LAST_90_DAYS = "last_90_days",
    THIS_YEAR = "this_year",
    CUSTOM = "custom"
}
export declare class FindAllSalesDto extends PaginationQueryDto {
    customerId?: string;
    salesRepId?: string;
    paymentMethod?: CustomerPaymentMethod;
    period?: OrderPeriod;
    startDate?: string;
    endDate?: string;
}
