import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { CreateExternalTransactionDto } from './dto/create-external-transaction.dto';
import { UpdateExternalTransactionDto } from './dto/update-external-transaction.dto';
import { FindExternalTransactionsDto } from './dto/find-external-transactions.dto';
export declare class ExternalTransactionService {
    private prisma;
    private notificationsService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    private notifyAdminsAndFinancialDirectors;
    private formatAmount;
    create(createDto: CreateExternalTransactionDto): Promise<{
        subsidiary: {
            id: string;
            subsidiaryName: string;
        };
        creator: {
            id: string;
            email: string;
            userName: string;
        };
    } & {
        description: string;
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.ExternalTransactionStatus;
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
        updatedAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        createdBy: string;
        transactionDate: Date;
        externalTransactionType: import("@prisma/client").$Enums.ExternalTransactionType;
        externalTransactionCategory: import("@prisma/client").$Enums.ExternalTransactionCategory;
        referenceNumber: string | null;
    }>;
    findAll(query: FindExternalTransactionsDto): Promise<import("../../common/pagination/pagination").PaginatedResult<{
        description: string;
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.ExternalTransactionStatus;
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
        updatedAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        createdBy: string;
        transactionDate: Date;
        externalTransactionType: import("@prisma/client").$Enums.ExternalTransactionType;
        externalTransactionCategory: import("@prisma/client").$Enums.ExternalTransactionCategory;
        referenceNumber: string | null;
    }>>;
    findOne(id: string): Promise<{
        subsidiary: {
            id: string;
            subsidiaryName: string;
        };
        creator: {
            id: string;
            email: string;
            userName: string;
        };
    } & {
        description: string;
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.ExternalTransactionStatus;
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
        updatedAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        createdBy: string;
        transactionDate: Date;
        externalTransactionType: import("@prisma/client").$Enums.ExternalTransactionType;
        externalTransactionCategory: import("@prisma/client").$Enums.ExternalTransactionCategory;
        referenceNumber: string | null;
    }>;
    update(id: string, updateDto: UpdateExternalTransactionDto): Promise<{
        subsidiary: {
            id: string;
            subsidiaryName: string;
        };
        creator: {
            id: string;
            email: string;
            userName: string;
        };
    } & {
        description: string;
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.ExternalTransactionStatus;
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
        updatedAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        createdBy: string;
        transactionDate: Date;
        externalTransactionType: import("@prisma/client").$Enums.ExternalTransactionType;
        externalTransactionCategory: import("@prisma/client").$Enums.ExternalTransactionCategory;
        referenceNumber: string | null;
    }>;
    validate(id: string, validatorUserId?: string): Promise<{
        subsidiary: {
            id: string;
            subsidiaryName: string;
        };
        creator: {
            id: string;
            email: string;
            userName: string;
        };
    } & {
        description: string;
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.ExternalTransactionStatus;
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
        updatedAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        createdBy: string;
        transactionDate: Date;
        externalTransactionType: import("@prisma/client").$Enums.ExternalTransactionType;
        externalTransactionCategory: import("@prisma/client").$Enums.ExternalTransactionCategory;
        referenceNumber: string | null;
    }>;
    cancel(id: string): Promise<{
        subsidiary: {
            id: string;
            subsidiaryName: string;
        };
        creator: {
            id: string;
            email: string;
            userName: string;
        };
    } & {
        description: string;
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.ExternalTransactionStatus;
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
        updatedAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        createdBy: string;
        transactionDate: Date;
        externalTransactionType: import("@prisma/client").$Enums.ExternalTransactionType;
        externalTransactionCategory: import("@prisma/client").$Enums.ExternalTransactionCategory;
        referenceNumber: string | null;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
    adminUpdate(id: string, updateDto: UpdateExternalTransactionDto, adminUserId: string): Promise<{
        subsidiary: {
            id: string;
            subsidiaryName: string;
        };
        creator: {
            id: string;
            email: string;
            userName: string;
        };
    } & {
        description: string;
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.ExternalTransactionStatus;
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod;
        updatedAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        createdBy: string;
        transactionDate: Date;
        externalTransactionType: import("@prisma/client").$Enums.ExternalTransactionType;
        externalTransactionCategory: import("@prisma/client").$Enums.ExternalTransactionCategory;
        referenceNumber: string | null;
    }>;
    adminRemove(id: string, adminUserId: string): Promise<{
        message: string;
    }>;
    getStatistics(subsidiaryId: string): Promise<{
        totalTransactions: number;
        totalAmount: number | import("@prisma/client/runtime/library").Decimal;
        transactionsByType: {
            type: import("@prisma/client").$Enums.ExternalTransactionType;
            count: number;
            amount: number | import("@prisma/client/runtime/library").Decimal;
        }[];
        transactionsByCategory: {
            category: import("@prisma/client").$Enums.ExternalTransactionCategory;
            count: number;
            amount: number | import("@prisma/client/runtime/library").Decimal;
        }[];
        transactionsByStatus: {
            status: import("@prisma/client").$Enums.ExternalTransactionStatus;
            count: number;
        }[];
        recentTransactions: {
            description: string;
            id: string;
            status: import("@prisma/client").$Enums.ExternalTransactionStatus;
            amount: import("@prisma/client/runtime/library").Decimal;
            transactionDate: Date;
            externalTransactionType: import("@prisma/client").$Enums.ExternalTransactionType;
        }[];
    }>;
}
