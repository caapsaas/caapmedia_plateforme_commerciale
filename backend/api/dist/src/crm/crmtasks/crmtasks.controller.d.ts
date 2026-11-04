import { CrmtasksService } from './crmtasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { type User } from '@prisma/client';
import { PaginationQueryDto } from "../../common/pagination/dto/pagination-query.dto";
export declare class CrmtasksController {
    private readonly crmtasksService;
    constructor(crmtasksService: CrmtasksService);
    create(createTaskDto: CreateTaskDto, user: User): Promise<{
        description: string | null;
        title: string;
        id: string;
        status: import("@prisma/client").$Enums.CrmTaskStatus;
        dueDate: Date;
        opportunityId: string | null;
        contactId: string;
        userId: string;
        priority: import("@prisma/client").$Enums.CrmTaskPriority;
    }>;
    findAll(user: User, paginationQuery: PaginationQueryDto): Promise<import("../../common/pagination/pagination").PaginatedResult<{
        description: string | null;
        title: string;
        id: string;
        status: import("@prisma/client").$Enums.CrmTaskStatus;
        dueDate: Date;
        opportunityId: string | null;
        contactId: string;
        userId: string;
        priority: import("@prisma/client").$Enums.CrmTaskPriority;
    }>>;
    findOne(id: string, user: User): Promise<{
        contact: {
            id: string;
            address: string;
            phone: string;
            email: string | null;
            passwordHash: string | null;
            subsidiaryId: string | null;
            status: import("@prisma/client").$Enums.ContactStatus | null;
            contactName: string;
            company: string;
            since: Date;
            isOccasional: boolean;
            isVerified: boolean;
            accountId: string | null;
            salesRepId: string | null;
        };
        opportunity: {
            id: string;
            subsidiaryId: string;
            accountId: string;
            opportunityName: string;
            opportunityValue: import("@prisma/client/runtime/library").Decimal;
            closeDate: Date;
            contactId: string;
            userId: string;
            stage: import("@prisma/client").$Enums.OpportunityStage;
            sourceOpportunity: import("@prisma/client").$Enums.OpportunitySource | null;
        };
    } & {
        description: string | null;
        title: string;
        id: string;
        status: import("@prisma/client").$Enums.CrmTaskStatus;
        dueDate: Date;
        opportunityId: string | null;
        contactId: string;
        userId: string;
        priority: import("@prisma/client").$Enums.CrmTaskPriority;
    }>;
    update(id: string, updateTaskDto: UpdateTaskDto, user: User): Promise<{
        description: string | null;
        title: string;
        id: string;
        status: import("@prisma/client").$Enums.CrmTaskStatus;
        dueDate: Date;
        opportunityId: string | null;
        contactId: string;
        userId: string;
        priority: import("@prisma/client").$Enums.CrmTaskPriority;
    }>;
    remove(id: string, user: User): Promise<{
        description: string | null;
        title: string;
        id: string;
        status: import("@prisma/client").$Enums.CrmTaskStatus;
        dueDate: Date;
        opportunityId: string | null;
        contactId: string;
        userId: string;
        priority: import("@prisma/client").$Enums.CrmTaskPriority;
    }>;
    updateStatus(id: string, updateTaskStatusDto: UpdateTaskStatusDto, user: User): Promise<{
        description: string | null;
        title: string;
        id: string;
        status: import("@prisma/client").$Enums.CrmTaskStatus;
        dueDate: Date;
        opportunityId: string | null;
        contactId: string;
        userId: string;
        priority: import("@prisma/client").$Enums.CrmTaskPriority;
    }>;
}
