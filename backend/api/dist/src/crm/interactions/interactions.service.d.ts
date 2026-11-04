import { PrismaService } from "../../common/utils/prisma/prisma.service";
import { User } from '@prisma/client';
import { CreateInteractionDto } from './dto/create-interaction.dto';
import { UpdateInteractionDto } from './dto/update-interaction.dto';
import { PaginationQueryDto } from "../../common/pagination/dto/pagination-query.dto";
export declare class InteractionsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createInteractionDto: CreateInteractionDto, user: User): Promise<{
        id: string;
        notes: string;
        contactId: string;
        userId: string;
        interactionDate: Date;
        typeInteractions: import("@prisma/client").$Enums.InteractionType;
    }>;
    findAll(user: User, paginationQuery?: PaginationQueryDto): Promise<import("src/common/pagination/pagination").PaginatedResult<{
        id: string;
        notes: string;
        contactId: string;
        userId: string;
        interactionDate: Date;
        typeInteractions: import("@prisma/client").$Enums.InteractionType;
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
    } & {
        id: string;
        notes: string;
        contactId: string;
        userId: string;
        interactionDate: Date;
        typeInteractions: import("@prisma/client").$Enums.InteractionType;
    }>;
    remove(id: string, user: User): Promise<{
        id: string;
        notes: string;
        contactId: string;
        userId: string;
        interactionDate: Date;
        typeInteractions: import("@prisma/client").$Enums.InteractionType;
    }>;
    update(id: string, updateInteractionDto: UpdateInteractionDto, user: User): Promise<{
        id: string;
        notes: string;
        contactId: string;
        userId: string;
        interactionDate: Date;
        typeInteractions: import("@prisma/client").$Enums.InteractionType;
    }>;
}
