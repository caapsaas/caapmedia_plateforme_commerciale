import { CrmTaskStatus, CrmTaskPriority } from '@prisma/client';
export declare class CreateTaskDto {
    title: string;
    description?: string;
    dueDate: string;
    contactId: string;
    opportunityId?: string;
    status: CrmTaskStatus;
    priority: CrmTaskPriority;
}
