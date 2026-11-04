import { AccountingAccessService } from './accounting-access.service';
import { CreateAccessRequestDto } from './dto/create-access-request.dto';
import { ApproveAccessRequestDto } from './dto/approve-access-request.dto';
import { RejectAccessRequestDto } from './dto/reject-access-request.dto';
import { PaginationQueryDto } from "../common/pagination/dto/pagination-query.dto";
export declare class AccountingAccessController {
    private readonly accessService;
    constructor(accessService: AccountingAccessService);
    findAll(req: any, paginationQuery: PaginationQueryDto): Promise<import("../common/pagination/pagination").PaginatedResult<{
        id: string;
        status: import("@prisma/client").$Enums.AccountingAccessStatus;
        userId: string;
        expiresAt: Date | null;
        justification: string;
        requestedAt: Date;
        reviewedAt: Date | null;
        rejectionNote: string | null;
        reviewedBy: string | null;
    }>>;
    myStatus(req: any): Promise<{
        hasAccess: true;
        reason: "HEADQUARTER_ADMIN";
        expiresAt?: undefined;
        requestId?: undefined;
    } | {
        hasAccess: true;
        reason: "APPROVED";
        expiresAt: Date;
        requestId?: undefined;
    } | {
        hasAccess: false;
        reason: "PENDING";
        requestId: string;
        expiresAt?: undefined;
    } | {
        hasAccess: false;
        reason: "NONE";
        expiresAt?: undefined;
        requestId?: undefined;
    }>;
    countPending(req: any): Promise<number>;
    createRequest(dto: CreateAccessRequestDto, req: any): Promise<{
        user: {
            email: string;
            userName: string;
        };
    } & {
        id: string;
        status: import("@prisma/client").$Enums.AccountingAccessStatus;
        userId: string;
        expiresAt: Date | null;
        justification: string;
        requestedAt: Date;
        reviewedAt: Date | null;
        rejectionNote: string | null;
        reviewedBy: string | null;
    }>;
    approve(id: string, dto: ApproveAccessRequestDto, req: any): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.AccountingAccessStatus;
        userId: string;
        expiresAt: Date | null;
        justification: string;
        requestedAt: Date;
        reviewedAt: Date | null;
        rejectionNote: string | null;
        reviewedBy: string | null;
    }>;
    reject(id: string, dto: RejectAccessRequestDto, req: any): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.AccountingAccessStatus;
        userId: string;
        expiresAt: Date | null;
        justification: string;
        requestedAt: Date;
        reviewedAt: Date | null;
        rejectionNote: string | null;
        reviewedBy: string | null;
    }>;
}
