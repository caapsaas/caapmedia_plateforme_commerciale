import { InteractionsService } from './interactions.service';
import { CreateInteractionDto } from './dto/create-interaction.dto';
import { UpdateInteractionDto } from './dto/update-interaction.dto';
import type { User } from '@prisma/client';
import { PaginationQueryDto } from "../../common/pagination/dto/pagination-query.dto";
export declare class InteractionsController {
    private readonly interactionsService;
    constructor(interactionsService: InteractionsService);
    create(createInteractionDto: CreateInteractionDto, user: User): Promise<{
        id: string;
        notes: string;
        contactId: string;
        userId: string;
        interactionDate: Date;
        typeInteractions: import("@prisma/client").$Enums.InteractionType;
    }>;
    findAll(user: User, paginationQuery: PaginationQueryDto): Promise<import("../../common/pagination/pagination").PaginatedResult<{
        id: string;
        notes: string;
        contactId: string;
        userId: string;
        interactionDate: Date;
        typeInteractions: import("@prisma/client").$Enums.InteractionType;
    }>>;
    update(id: string, updateInteractionDto: UpdateInteractionDto, user: User): Promise<{
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
}
