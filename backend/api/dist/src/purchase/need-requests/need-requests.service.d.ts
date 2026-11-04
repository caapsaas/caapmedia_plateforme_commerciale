import { AccountingOutboxService } from '../../accounting/outbox/accounting-outbox.service';
import { PayNeedRequestDto } from './dto/pay-need-request.dto';
import { NotificationsService } from '../../notifications/notifications.service';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/utils/prisma/prisma.service';
import { JwtUser } from '../../common/auth/jwt/jwt-user.interface';
import { CreateNeedRequestDto, ReviewNeedRequestDto } from './dto/need-request.dto';
export declare class NeedRequestsService {
    private readonly prisma;
    private readonly notifications;
    private readonly accountingOutbox;
    constructor(prisma: PrismaService, notifications: NotificationsService, accountingOutbox: AccountingOutboxService);
    private assertAccess;
    findAll(user: JwtUser): Prisma.PrismaPromise<({
        subsidiary: {
            id: string;
            subsidiaryName: string;
        };
        reviewer: {
            id: string;
            userName: string;
        };
        requester: {
            id: string;
            userName: string;
        };
        payment: {
            financialTransaction: {
                treasuryAccount: {
                    id: string;
                    accountName: string;
                };
            };
            paidBy: {
                id: string;
                userName: string;
            };
        } & {
            id: string;
            category: import("@prisma/client").$Enums.ExpenseCategory;
            currency: string;
            amount: Prisma.Decimal;
            createdAt: Date;
            reference: string | null;
            beneficiary: string;
            needRequestId: string;
            financialTransactionId: string;
            paidAt: Date;
            paidById: string;
        };
    } & {
        description: string;
        title: string;
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.NeedRequestStatus;
        createdAt: Date;
        reviewedAt: Date | null;
        estimatedBudget: Prisma.Decimal | null;
        desiredDate: Date | null;
        rejectionReason: string | null;
        requesterId: string;
        reviewerId: string | null;
    })[]>;
    create(user: JwtUser, dto: CreateNeedRequestDto): Promise<{
        subsidiary: {
            id: string;
            subsidiaryName: string;
        };
        reviewer: {
            id: string;
            userName: string;
        };
        requester: {
            id: string;
            userName: string;
        };
        payment: {
            financialTransaction: {
                treasuryAccount: {
                    id: string;
                    accountName: string;
                };
            };
            paidBy: {
                id: string;
                userName: string;
            };
        } & {
            id: string;
            category: import("@prisma/client").$Enums.ExpenseCategory;
            currency: string;
            amount: Prisma.Decimal;
            createdAt: Date;
            reference: string | null;
            beneficiary: string;
            needRequestId: string;
            financialTransactionId: string;
            paidAt: Date;
            paidById: string;
        };
    } & {
        description: string;
        title: string;
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.NeedRequestStatus;
        createdAt: Date;
        reviewedAt: Date | null;
        estimatedBudget: Prisma.Decimal | null;
        desiredDate: Date | null;
        rejectionReason: string | null;
        requesterId: string;
        reviewerId: string | null;
    }>;
    private createAndNotify;
    private assertPayer;
    paymentAccount(user: JwtUser, id: string): Promise<{
        id: string;
        accountName: string;
        balance: Prisma.Decimal;
        currency: string;
    }>;
    private resolveExpenseBox;
    pay(user: JwtUser, id: string, dto: PayNeedRequestDto): Promise<{
        subsidiary: {
            id: string;
            subsidiaryName: string;
        };
        reviewer: {
            id: string;
            userName: string;
        };
        requester: {
            id: string;
            userName: string;
        };
        payment: {
            financialTransaction: {
                treasuryAccount: {
                    id: string;
                    accountName: string;
                };
            };
            paidBy: {
                id: string;
                userName: string;
            };
        } & {
            id: string;
            category: import("@prisma/client").$Enums.ExpenseCategory;
            currency: string;
            amount: Prisma.Decimal;
            createdAt: Date;
            reference: string | null;
            beneficiary: string;
            needRequestId: string;
            financialTransactionId: string;
            paidAt: Date;
            paidById: string;
        };
    } & {
        description: string;
        title: string;
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.NeedRequestStatus;
        createdAt: Date;
        reviewedAt: Date | null;
        estimatedBudget: Prisma.Decimal | null;
        desiredDate: Date | null;
        rejectionReason: string | null;
        requesterId: string;
        reviewerId: string | null;
    }>;
    review(user: JwtUser, id: string, dto: ReviewNeedRequestDto): Promise<{
        subsidiary: {
            id: string;
            subsidiaryName: string;
        };
        reviewer: {
            id: string;
            userName: string;
        };
        requester: {
            id: string;
            userName: string;
        };
        payment: {
            financialTransaction: {
                treasuryAccount: {
                    id: string;
                    accountName: string;
                };
            };
            paidBy: {
                id: string;
                userName: string;
            };
        } & {
            id: string;
            category: import("@prisma/client").$Enums.ExpenseCategory;
            currency: string;
            amount: Prisma.Decimal;
            createdAt: Date;
            reference: string | null;
            beneficiary: string;
            needRequestId: string;
            financialTransactionId: string;
            paidAt: Date;
            paidById: string;
        };
    } & {
        description: string;
        title: string;
        id: string;
        subsidiaryId: string;
        status: import("@prisma/client").$Enums.NeedRequestStatus;
        createdAt: Date;
        reviewedAt: Date | null;
        estimatedBudget: Prisma.Decimal | null;
        desiredDate: Date | null;
        rejectionReason: string | null;
        requesterId: string;
        reviewerId: string | null;
    }>;
}
