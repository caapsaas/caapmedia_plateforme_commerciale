import { NotificationType, UserRole, Prisma, Notification } from '@prisma/client';
import { PrismaService } from "../common/utils/prisma/prisma.service";
import { PaginationQueryDto } from "../common/pagination/dto/pagination-query.dto";
import { NotificationsSseService } from './notifications-sse.service';
export interface NotifyPayload {
    title: string;
    message: string;
    type: NotificationType;
    orderId?: string;
    data?: Record<string, unknown>;
    targetRole?: UserRole;
}
export declare class NotificationsService {
    private readonly prisma;
    private readonly sse;
    constructor(prisma: PrismaService, sse: NotificationsSseService);
    createNotification(userId: string, payload: NotifyPayload, client?: Prisma.TransactionClient): Prisma.Prisma__NotificationClient<{
        type: import("@prisma/client").$Enums.NotificationType;
        title: string;
        data: Prisma.JsonValue | null;
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    publish(notification: Notification): void;
    notifyUser(userId: string, payload: NotifyPayload): Promise<{
        type: import("@prisma/client").$Enums.NotificationType;
        title: string;
        data: Prisma.JsonValue | null;
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
    notifyUsersByRole(subsidiaryId: string, role: UserRole, payload: NotifyPayload, recipientId?: string): Promise<{
        type: import("@prisma/client").$Enums.NotificationType;
        title: string;
        data: Prisma.JsonValue | null;
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
    }[]>;
    getUserNotifications(userId: string, activeRole: UserRole, unreadOnly: boolean, paginationQuery?: PaginationQueryDto): Promise<import("src/common/pagination/pagination").PaginatedResult<{
        type: import("@prisma/client").$Enums.NotificationType;
        title: string;
        data: Prisma.JsonValue | null;
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
    getUnreadCount(userId: string, activeRole: UserRole): Promise<{
        count: number;
    }>;
    markAsRead(id: string, userId: string): Promise<{
        type: import("@prisma/client").$Enums.NotificationType;
        title: string;
        data: Prisma.JsonValue | null;
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
    markAllAsRead(userId: string, activeRole: UserRole): Promise<{
        count: number;
    }>;
}
