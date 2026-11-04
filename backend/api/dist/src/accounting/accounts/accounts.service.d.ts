import { PrismaService } from "../../common/utils/prisma/prisma.service";
import { AccountingAccountType } from '@prisma/client';
import { PaginationQueryDto } from "../../common/pagination/dto/pagination-query.dto";
import { PaginatedResult } from "../../common/pagination/pagination";
import type { AccountingAccount } from '@prisma/client';
export interface CreateAccountDto {
    accountNumber: string;
    accountName: string;
    accountType: AccountingAccountType;
    class?: number;
    parentAccountId?: string;
}
export declare const SYSCOHADA_SEED_ACCOUNTS: {
    num: string;
    name: string;
    type: string;
    class: number;
}[];
export declare class AccountsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    seedSyscohada(): Promise<void>;
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
    findAll(paginationQuery: PaginationQueryDto, type?: AccountingAccountType, includeInactive?: boolean): Promise<PaginatedResult<AccountingAccount>>;
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
    findByNumber(accountNumber: string): Promise<{
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
