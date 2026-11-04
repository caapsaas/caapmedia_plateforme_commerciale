import { PrismaService } from "../../common/utils/prisma/prisma.service";
import { JournalEntryStatus, Prisma } from '@prisma/client';
import { JwtUser } from "../../common/auth/jwt/jwt-user.interface";
import { PaginationQueryDto } from "../../common/pagination/dto/pagination-query.dto";
export interface CreateJournalEntryDto {
    entryDate: string;
    description: string;
    journalId: string;
    fiscalYearId?: string;
    lines: Array<{
        accountId: string;
        description: string;
        debitAmount: number;
        creditAmount: number;
    }>;
}
export interface AutomaticEntryLineInput {
    accountNumber: string;
    description?: string;
    debitAmount: number;
    creditAmount: number;
}
export interface CreateAutomaticEntryDto {
    date: Date;
    reference: string;
    description: string;
    journalCode: string;
    subsidiaryId: string;
    sourceType?: string;
    sourceId?: string;
    lines: AutomaticEntryLineInput[];
}
export declare class EntriesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(user: JwtUser, fiscalYearId?: string, status?: JournalEntryStatus, startDate?: string, endDate?: string, subsidiaryIdFilter?: string, paginationQuery?: PaginationQueryDto): Promise<import("src/common/pagination/pagination").PaginatedResult<{
        description: string;
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.JournalEntryStatus;
        updatedAt: Date;
        createdAt: Date;
        createdBy: string | null;
        fiscalYearId: string | null;
        entryDate: Date;
        entryNumber: string;
        journalId: string;
        sequentialNumber: string | null;
        reversalOfEntryId: string | null;
        sourceType: string | null;
        sourceId: string | null;
    }>>;
    findOne(id: string, user: JwtUser): Promise<{
        fiscalYear: {
            name: string;
        };
        journal: {
            name: string;
            code: string;
        };
        lines: ({
            account: {
                accountNumber: string;
                accountName: string;
            };
        } & {
            description: string;
            id: string;
            accountId: string;
            debitAmount: Prisma.Decimal;
            creditAmount: Prisma.Decimal;
            journalEntryId: string;
        })[];
        reversalOfEntry: {
            id: string;
            entryNumber: string;
        };
        reversedByEntries: {
            id: string;
            entryNumber: string;
        }[];
    } & {
        description: string;
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.JournalEntryStatus;
        updatedAt: Date;
        createdAt: Date;
        createdBy: string | null;
        fiscalYearId: string | null;
        entryDate: Date;
        entryNumber: string;
        journalId: string;
        sequentialNumber: string | null;
        reversalOfEntryId: string | null;
        sourceType: string | null;
        sourceId: string | null;
    }>;
    create(dto: CreateJournalEntryDto, user: JwtUser): Promise<{
        lines: ({
            account: {
                id: string;
                accountNumber: string;
                isActive: boolean;
                updatedAt: Date;
                accountName: string;
                accountType: import("@prisma/client").$Enums.AccountingAccountType;
                createdAt: Date;
                class: number | null;
                parentAccountId: string | null;
            };
        } & {
            description: string;
            id: string;
            accountId: string;
            debitAmount: Prisma.Decimal;
            creditAmount: Prisma.Decimal;
            journalEntryId: string;
        })[];
    } & {
        description: string;
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.JournalEntryStatus;
        updatedAt: Date;
        createdAt: Date;
        createdBy: string | null;
        fiscalYearId: string | null;
        entryDate: Date;
        entryNumber: string;
        journalId: string;
        sequentialNumber: string | null;
        reversalOfEntryId: string | null;
        sourceType: string | null;
        sourceId: string | null;
    }>;
    post(id: string, user: JwtUser): Promise<{
        description: string;
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.JournalEntryStatus;
        updatedAt: Date;
        createdAt: Date;
        createdBy: string | null;
        fiscalYearId: string | null;
        entryDate: Date;
        entryNumber: string;
        journalId: string;
        sequentialNumber: string | null;
        reversalOfEntryId: string | null;
        sourceType: string | null;
        sourceId: string | null;
    }>;
    cancel(id: string, user: JwtUser): Promise<{
        description: string;
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.JournalEntryStatus;
        updatedAt: Date;
        createdAt: Date;
        createdBy: string | null;
        fiscalYearId: string | null;
        entryDate: Date;
        entryNumber: string;
        journalId: string;
        sequentialNumber: string | null;
        reversalOfEntryId: string | null;
        sourceType: string | null;
        sourceId: string | null;
    }>;
    reverse(id: string, user: JwtUser): Promise<{
        lines: {
            description: string;
            id: string;
            accountId: string;
            debitAmount: Prisma.Decimal;
            creditAmount: Prisma.Decimal;
            journalEntryId: string;
        }[];
    } & {
        description: string;
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.JournalEntryStatus;
        updatedAt: Date;
        createdAt: Date;
        createdBy: string | null;
        fiscalYearId: string | null;
        entryDate: Date;
        entryNumber: string;
        journalId: string;
        sequentialNumber: string | null;
        reversalOfEntryId: string | null;
        sourceType: string | null;
        sourceId: string | null;
    }>;
    createAutomaticEntry(dto: CreateAutomaticEntryDto): Promise<{
        description: string;
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.JournalEntryStatus;
        updatedAt: Date;
        createdAt: Date;
        createdBy: string | null;
        fiscalYearId: string | null;
        entryDate: Date;
        entryNumber: string;
        journalId: string;
        sequentialNumber: string | null;
        reversalOfEntryId: string | null;
        sourceType: string | null;
        sourceId: string | null;
    }>;
    private validateBalance;
    private resolveFiscalYearId;
    private assignSequentialNumber;
}
