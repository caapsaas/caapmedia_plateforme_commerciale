import { NotificationsService } from './notifications.service';
import type { JwtUser } from "../common/auth/jwt/jwt-user.interface";
import { PaginationQueryDto } from "../common/pagination/dto/pagination-query.dto";
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    findAll(user: JwtUser, paginationQuery: PaginationQueryDto, unreadOnly?: string): Promise<import("../common/pagination/pagination").PaginatedResult<{
        type: import("@prisma/client").$Enums.NotificationType;
        title: string;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        updatedAt: Date;
        userId: string | null;
        orderId: string | null;
        createdAt: Date;
        targetRole: import("@prisma/client").$Enums.UserRole | null;
        message: string;
        read: boolean;
        recipientId: string;
        recipientType: import("@prisma/client").$Enums.RecipientType;
    }>>;
    getUnreadCount(user: JwtUser): Promise<{
        count: number;
    }>;
    markAsRead(id: string, user: JwtUser): Promise<{
        type: import("@prisma/client").$Enums.NotificationType;
        title: string;
        data: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        updatedAt: Date;
        userId: string | null;
        orderId: string | null;
        createdAt: Date;
        targetRole: import("@prisma/client").$Enums.UserRole | null;
        message: string;
        read: boolean;
        recipientId: string;
        recipientType: import("@prisma/client").$Enums.RecipientType;
    }>;
    markAllAsRead(user: JwtUser): Promise<{
        count: number;
    }>;
}
