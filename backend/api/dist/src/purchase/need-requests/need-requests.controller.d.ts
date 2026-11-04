import { PayNeedRequestDto } from './dto/pay-need-request.dto';
import { Request } from 'express';
import { JwtUser } from '../../common/auth/jwt/jwt-user.interface';
import { CreateNeedRequestDto, ReviewNeedRequestDto } from './dto/need-request.dto';
import { NeedRequestsService } from './need-requests.service';
export declare class NeedRequestsController {
    private readonly service;
    constructor(service: NeedRequestsService);
    list(req: Request & {
        user: JwtUser;
    }): import("@prisma/client").Prisma.PrismaPromise<({
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
            amount: import("@prisma/client/runtime/library").Decimal;
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
        estimatedBudget: import("@prisma/client/runtime/library").Decimal | null;
        desiredDate: Date | null;
        rejectionReason: string | null;
        requesterId: string;
        reviewerId: string | null;
    })[]>;
    create(req: Request & {
        user: JwtUser;
    }, dto: CreateNeedRequestDto): Promise<{
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
            amount: import("@prisma/client/runtime/library").Decimal;
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
        estimatedBudget: import("@prisma/client/runtime/library").Decimal | null;
        desiredDate: Date | null;
        rejectionReason: string | null;
        requesterId: string;
        reviewerId: string | null;
    }>;
    paymentAccount(req: Request & {
        user: JwtUser;
    }, id: string): Promise<{
        id: string;
        accountName: string;
        balance: import("@prisma/client/runtime/library").Decimal;
        currency: string;
    }>;
    pay(req: Request & {
        user: JwtUser;
    }, id: string, dto: PayNeedRequestDto): Promise<{
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
            amount: import("@prisma/client/runtime/library").Decimal;
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
        estimatedBudget: import("@prisma/client/runtime/library").Decimal | null;
        desiredDate: Date | null;
        rejectionReason: string | null;
        requesterId: string;
        reviewerId: string | null;
    }>;
    review(req: Request & {
        user: JwtUser;
    }, id: string, dto: ReviewNeedRequestDto): Promise<{
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
            amount: import("@prisma/client/runtime/library").Decimal;
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
        estimatedBudget: import("@prisma/client/runtime/library").Decimal | null;
        desiredDate: Date | null;
        rejectionReason: string | null;
        requesterId: string;
        reviewerId: string | null;
    }>;
}
