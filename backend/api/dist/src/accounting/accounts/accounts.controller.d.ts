import { AccountsService } from './accounts.service';
import type { CreateAccountDto } from './accounts.service';
import { JournalsService } from '../journals/journals.service';
import { MappingsService } from './mappings.service';
import { PaginationQueryDto } from "../../common/pagination/dto/pagination-query.dto";
export declare class AccountsController {
    private readonly accountsService;
    private readonly journalsService;
    private readonly mappingsService;
    constructor(accountsService: AccountsService, journalsService: JournalsService, mappingsService: MappingsService);
    seed(): Promise<{
        message: string;
    }>;
    create(dto: CreateAccountDto): Promise<{
        id: string;
        accountNumber: string;
        isActive: boolean;
        updatedAt: Date;
        accountName: string;
        accountType: import("@prisma/client").$Enums.AccountingAccountType;
        createdAt: Date;
        class: number | null;
        parentAccountId: string | null;
    }>;
    findAll(paginationQuery: PaginationQueryDto, type?: string, includeInactive?: string): Promise<import("../../common/pagination/pagination").PaginatedResult<{
        id: string;
        accountNumber: string;
        isActive: boolean;
        updatedAt: Date;
        accountName: string;
        accountType: import("@prisma/client").$Enums.AccountingAccountType;
        createdAt: Date;
        class: number | null;
        parentAccountId: string | null;
    }>>;
    findOne(id: string): Promise<{
        id: string;
        accountNumber: string;
        isActive: boolean;
        updatedAt: Date;
        accountName: string;
        accountType: import("@prisma/client").$Enums.AccountingAccountType;
        createdAt: Date;
        class: number | null;
        parentAccountId: string | null;
    }>;
    update(id: string, dto: Partial<CreateAccountDto>): Promise<{
        id: string;
        accountNumber: string;
        isActive: boolean;
        updatedAt: Date;
        accountName: string;
        accountType: import("@prisma/client").$Enums.AccountingAccountType;
        createdAt: Date;
        class: number | null;
        parentAccountId: string | null;
    }>;
    deactivate(id: string): Promise<{
        id: string;
        accountNumber: string;
        isActive: boolean;
        updatedAt: Date;
        accountName: string;
        accountType: import("@prisma/client").$Enums.AccountingAccountType;
        createdAt: Date;
        class: number | null;
        parentAccountId: string | null;
    }>;
}
