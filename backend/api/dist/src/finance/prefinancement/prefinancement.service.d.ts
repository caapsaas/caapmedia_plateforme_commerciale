import { PrismaService } from "../../common/utils/prisma/prisma.service";
import { TreasuryService } from '../treasury/treasury.service';
import { FindPrefinancementTransactionsDto } from './dto/find-prefinancement-transactions.dto';
export declare class PrefinancementService {
    private readonly prisma;
    private readonly treasuryService;
    constructor(prisma: PrismaService, treasuryService: TreasuryService);
    createAccount(createDto: {
        accountName: string;
        initialBalance?: number;
        subsidiaryId: string;
    }): Promise<{
        id: string;
        subsidiaryId: string;
        lastUpdated: Date;
        updatedAt: Date;
        accountName: string;
        balance: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        userId: string | null;
        createdAt: Date;
    }>;
    findAccount(subsidiaryId?: string): Promise<{
        id: string;
        accountName: string;
        balance: number;
        currency: string;
        lastUpdated: string;
        subsidiaryId: string;
    }>;
    updateAccount(accountId: string, updateDto: {
        accountName?: string;
        initialBalance?: number;
        subsidiaryId?: string;
    }): Promise<{
        id: string;
        subsidiaryId: string;
        lastUpdated: Date;
        updatedAt: Date;
        accountName: string;
        balance: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        userId: string | null;
        createdAt: Date;
    }>;
    createTransaction(createDto: {
        date: string;
        description: string;
        amount: number;
        type: 'CREDIT' | 'DEBIT';
        category: 'MATERIELS_PREMIER' | 'MAIN_D_OEUVRE' | 'ENERGIE' | 'TRANSPORT' | 'AUTRE';
        referenceNumber?: string;
        relatedOrderId?: string;
        notes?: string;
        subsidiaryId: string;
        createdBy: string;
    }): Promise<{
        type: import("@prisma/client").$Enums.PrefinancementTransactionType;
        description: string;
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.PrefinancementStatus;
        category: import("@prisma/client").$Enums.PrefinancementCategory;
        notes: string | null;
        updatedAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        date: Date;
        createdBy: string;
        referenceNumber: string | null;
        relatedOrderId: string | null;
    }>;
    findTransactions(filters: FindPrefinancementTransactionsDto): Promise<import("src/common/pagination/pagination").PaginatedResult<{
        type: import("@prisma/client").$Enums.PrefinancementTransactionType;
        description: string;
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.PrefinancementStatus;
        category: import("@prisma/client").$Enums.PrefinancementCategory;
        notes: string | null;
        updatedAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        date: Date;
        createdBy: string;
        referenceNumber: string | null;
        relatedOrderId: string | null;
    }>>;
    findTransactionById(id: string): Promise<{
        type: import("@prisma/client").$Enums.PrefinancementTransactionType;
        description: string;
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.PrefinancementStatus;
        category: import("@prisma/client").$Enums.PrefinancementCategory;
        notes: string | null;
        updatedAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        date: Date;
        createdBy: string;
        referenceNumber: string | null;
        relatedOrderId: string | null;
    }>;
    updateTransaction(id: string, updateDto: {
        date?: string;
        description?: string;
        amount?: number;
        type?: 'CREDIT' | 'DEBIT';
        category?: 'MATERIELS_PREMIER' | 'MAIN_D_OEUVRE' | 'ENERGIE' | 'TRANSPORT' | 'AUTRE';
        referenceNumber?: string;
        relatedOrderId?: string;
        notes?: string;
    }): Promise<{
        type: import("@prisma/client").$Enums.PrefinancementTransactionType;
        description: string;
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.PrefinancementStatus;
        category: import("@prisma/client").$Enums.PrefinancementCategory;
        notes: string | null;
        updatedAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        date: Date;
        createdBy: string;
        referenceNumber: string | null;
        relatedOrderId: string | null;
    }>;
    validateTransaction(id: string): Promise<{
        type: import("@prisma/client").$Enums.PrefinancementTransactionType;
        description: string;
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.PrefinancementStatus;
        category: import("@prisma/client").$Enums.PrefinancementCategory;
        notes: string | null;
        updatedAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        date: Date;
        createdBy: string;
        referenceNumber: string | null;
        relatedOrderId: string | null;
    }>;
    cancelTransaction(id: string): Promise<{
        type: import("@prisma/client").$Enums.PrefinancementTransactionType;
        description: string;
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.PrefinancementStatus;
        category: import("@prisma/client").$Enums.PrefinancementCategory;
        notes: string | null;
        updatedAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        date: Date;
        createdBy: string;
        referenceNumber: string | null;
        relatedOrderId: string | null;
    }>;
    deleteTransaction(id: string): Promise<{
        type: import("@prisma/client").$Enums.PrefinancementTransactionType;
        description: string;
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.PrefinancementStatus;
        category: import("@prisma/client").$Enums.PrefinancementCategory;
        notes: string | null;
        updatedAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        date: Date;
        createdBy: string;
        referenceNumber: string | null;
        relatedOrderId: string | null;
    }>;
    getStatistics(subsidiaryId: string): Promise<{
        totalBalance: number;
        totalCredits: number;
        totalDebits: number;
        transactionCount: number;
        creditsByCategory: {
            category: string;
            amount: number;
            count: number;
        }[];
        debitsByCategory: {
            category: string;
            amount: number;
            count: number;
        }[];
    }>;
}
