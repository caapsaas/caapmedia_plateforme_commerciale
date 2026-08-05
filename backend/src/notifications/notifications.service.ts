import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  NotificationType,
  RecipientType,
  UserRole,
  Prisma,
} from '@prisma/client';
import { PrismaService } from 'src/common/utils/prisma/prisma.service';
import { generateId } from 'src/common/utils/generate-id.util';
import { ID_PREFIXES } from 'src/common/constants/id-prefixes.const';
import { paginate } from 'src/common/pagination/pagination';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';
import { NotificationsSseService } from './notifications-sse.service';

export interface NotifyPayload {
  title: string;
  message: string;
  type: NotificationType;
  orderId?: string;
  data?: Record<string, unknown>;
  targetRole?: UserRole;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sse: NotificationsSseService,
  ) {}

  /** Point d'entrée unique de création — toute notification staff passe par ici (persistance + push SSE). */
  async notifyUser(userId: string, payload: NotifyPayload) {
    const notification = await this.prisma.notification.create({
      data: {
        id: generateId(ID_PREFIXES.NOTIFICATION),
        title: payload.title,
        message: payload.message,
        type: payload.type,
        recipientId: userId,
        recipientType: RecipientType.USER,
        userId,
        orderId: payload.orderId,
        data: payload.data as Prisma.InputJsonValue | undefined,
        targetRole: payload.targetRole,
      },
    });
    this.sse.push(userId, notification);
    return notification;
  }

  /** Notifie tous les utilisateurs ayant `role` (actif ou secondaire) dans la filiale. */
  async notifyUsersByRole(
    subsidiaryId: string,
    role: UserRole,
    payload: NotifyPayload,
  ) {
    const users = await this.prisma.user.findMany({
      where: {
        subsidiaryId,
        OR: [
          { userRole: role },
          { roles: { has: role } },
          { additionalRoles: { has: role } },
        ],
      },
      select: { id: true },
    });
    return Promise.all(
      users.map((u) =>
        this.notifyUser(u.id, {
          ...payload,
          targetRole: payload.targetRole ?? role,
        }),
      ),
    );
  }

  async getUserNotifications(
    userId: string,
    activeRole: UserRole,
    unreadOnly: boolean,
    paginationQuery: PaginationQueryDto = {},
  ) {
    const where: Prisma.NotificationWhereInput = {
      recipientId: userId,
      recipientType: RecipientType.USER,
      OR: [{ targetRole: null }, { targetRole: activeRole }],
      ...(unreadOnly ? { read: false } : {}),
    };

    return paginate(
      this.prisma.notification,
      { where, orderBy: { createdAt: 'desc' } },
      paginationQuery,
    );
  }

  async getUnreadCount(
    userId: string,
    activeRole: UserRole,
  ): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({
      where: {
        recipientId: userId,
        recipientType: RecipientType.USER,
        read: false,
        OR: [{ targetRole: null }, { targetRole: activeRole }],
      },
    });
    return { count };
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!notification) {
      throw new NotFoundException(`Notification with ID "${id}" not found.`);
    }
    if (notification.recipientId !== userId) {
      throw new ForbiddenException(
        'Cette notification ne vous appartient pas.',
      );
    }
    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllAsRead(
    userId: string,
    activeRole: UserRole,
  ): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: {
        recipientId: userId,
        recipientType: RecipientType.USER,
        read: false,
        OR: [{ targetRole: null }, { targetRole: activeRole }],
      },
      data: { read: true },
    });
    return { count: result.count };
  }
}
