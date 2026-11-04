import { SecretariatTaskStatus } from '@prisma/client';
import { PaginationQueryDto } from "../../common/pagination/dto/pagination-query.dto";
export declare class CreateSecretariatTaskDto {
    title: string;
    description: string;
    dueDate: string;
    status: SecretariatTaskStatus;
    assignedToId?: string;
    subsidiaryId?: string;
}
export declare class UpdateSecretariatTaskDto {
    title?: string;
    description?: string;
    dueDate?: string;
    status?: SecretariatTaskStatus;
    assignedToId?: string;
}
export declare class SearchSecretariatTasksDto extends PaginationQueryDto {
    title?: string;
    status?: SecretariatTaskStatus;
    dueDate?: string;
}
