import { PrismaService } from "../common/utils/prisma/prisma.service";
import { EmailService } from "../common/utils/email/email.service";
import { NotificationsService } from "../notifications/notifications.service";
import { JwtUser } from "../common/auth/jwt/jwt-user.interface";
import { CreateAccessRequestDto } from './dto/create-access-request.dto';
import { ApproveAccessRequestDto } from './dto/approve-access-request.dto';
import { RejectAccessRequestDto } from './dto/reject-access-request.dto';
import { PaginationQueryDto } from "../common/pagination/dto/pagination-query.dto";
export declare class AccountingAccessService {
    private readonly prisma;
    private readonly emailService;
    private readonly notificationsService;
    constructor(prisma: PrismaService, emailService: EmailService, notificationsService: NotificationsService);
    isHeadquarterAdmin(user: JwtUser): Promise<boolean>;
    hasActiveAccess(user: JwtUser): Promise<boolean>;
    createRequest(user: JwtUser, dto: CreateAccessRequestDto): Promise<{
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
    approve(id: string, dto: ApproveAccessRequestDto, reviewer: JwtUser): Promise<{
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
    reject(id: string, dto: RejectAccessRequestDto, reviewer: JwtUser): Promise<{
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
    findAll(user: JwtUser, paginationQuery?: PaginationQueryDto): Promise<import("src/common/pagination/pagination").PaginatedResult<{
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
    countPending(user: JwtUser): Promise<number>;
    myStatus(user: JwtUser): Promise<{
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
    private notifyHeadquarterAdmins;
}
