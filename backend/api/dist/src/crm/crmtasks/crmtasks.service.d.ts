import { PrismaService } from "../../common/utils/prisma/prisma.service";
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Prisma, User, CrmTaskStatus } from '@prisma/client';
import { PaginationQueryDto } from "../../common/pagination/dto/pagination-query.dto";
export declare class CrmtasksService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createTaskDto: CreateTaskDto, creator: User): Promise<{
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
    findAll(user: User, paginationQuery?: PaginationQueryDto): Promise<import("src/common/pagination/pagination").PaginatedResult<{
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
            opportunityValue: Prisma.Decimal;
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
    updateStatus(id: string, status: CrmTaskStatus, user: User): Promise<{
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
