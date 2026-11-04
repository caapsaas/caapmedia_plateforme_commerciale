import { PaginationQueryDto } from "../../../common/pagination/dto/pagination-query.dto";
export declare class FindExternalTransactionsDto extends PaginationQueryDto {
    subsidiaryId: string;
    type?: string;
    category?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
}
