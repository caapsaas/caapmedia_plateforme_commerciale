import { PaginationQueryDto } from "../../../common/pagination/dto/pagination-query.dto";
export declare class FindPrefinancementTransactionsDto extends PaginationQueryDto {
    subsidiaryId?: string;
    type?: 'CREDIT' | 'DEBIT';
    category?: 'MATERIELS_PREMIER' | 'MAIN_D_OEUVRE' | 'ENERGIE' | 'TRANSPORT' | 'AUTRE';
    status?: 'VALIDE' | 'EN_ATTENTE' | 'ANNULE';
    startDate?: string;
    endDate?: string;
}
