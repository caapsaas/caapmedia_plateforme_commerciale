import { EntriesService } from './entries.service';
import type { CreateJournalEntryDto } from './entries.service';
import type { JournalEntryStatus } from '@prisma/client';
import { PaginationQueryDto } from "../../common/pagination/dto/pagination-query.dto";
export declare class EntriesController {
    private readonly entriesService;
    constructor(entriesService: EntriesService);
    create(dto: CreateJournalEntryDto, req: any): Promise<{
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
            debitAmount: import("@prisma/client/runtime/library").Decimal;
            creditAmount: import("@prisma/client/runtime/library").Decimal;
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
    findAll(req: any, paginationQuery: PaginationQueryDto, fiscalYearId?: string, status?: JournalEntryStatus, startDate?: string, endDate?: string, subsidiaryId?: string): Promise<import("../../common/pagination/pagination").PaginatedResult<{
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
    findOne(id: string, req: any): Promise<{
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
            debitAmount: import("@prisma/client/runtime/library").Decimal;
            creditAmount: import("@prisma/client/runtime/library").Decimal;
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
    post(id: string, req: any): Promise<{
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
    cancel(id: string, req: any): Promise<{
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
    reverse(id: string, req: any): Promise<{
        lines: {
            description: string;
            id: string;
            accountId: string;
            debitAmount: import("@prisma/client/runtime/library").Decimal;
            creditAmount: import("@prisma/client/runtime/library").Decimal;
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
}
