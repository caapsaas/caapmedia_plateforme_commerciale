import { PaginationQueryDto } from './dto/pagination-query.dto';
export interface PaginatedResult<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}
interface PaginatableModel<T> {
    findMany(args: Record<string, unknown>): Promise<T[]>;
    count(args: {
        where?: Record<string, unknown>;
    }): Promise<number>;
}
export declare function paginate<T>(model: PaginatableModel<T>, query?: Record<string, unknown>, options?: PaginationQueryDto): Promise<PaginatedResult<T>>;
export {};
