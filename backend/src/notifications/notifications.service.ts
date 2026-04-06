import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/utils/prisma/prisma.service';

export interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read?: boolean;
  createdAt?: string;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // Utilitaire pour formater les montants
  private formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  async getUserNotifications(userId: string): Promise<NotificationData[]> {
    const notifications = await this.prisma.notification.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to 50 most recent notifications
    });

    return notifications.map(notification => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      read: notification.read,
      createdAt: notification.createdAt.toISOString(),
    }));
  }

  async getUnreadNotificationsCount(userId: string): Promise<number> {
    const count = await this.prisma.notification.count({
      where: {
        userId: userId,
        read: false,
      },
    });

    return count;
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: userId, // Ensure user can only mark their own notifications
      },
      data: {
        read: true,
      },
    });
  }

  async createNotification(data: {
    type: string;
    title: string;
    message: string;
    data?: any;
    userId: string;
  }): Promise<NotificationData> {
    const notification = await this.prisma.notification.create({
      data: {
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data,
        userId: data.userId,
      },
    });

    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      read: notification.read,
      createdAt: notification.createdAt.toISOString(),
    };
  }

  async sendAdminNotification(payload: {
    type: string;
    title: string;
    message: string;
    data: any;
  }): Promise<void> {
    // Get all admin users and financial directors
    const adminUsers = await this.prisma.user.findMany({
      where: {
        userRole: {
          in: ['ADMIN', 'FINANCIAL_DIRECTOR']
        },
      },
      select: {
        id: true,
      },
    });

    // Create notification for each admin and financial director
    await Promise.all(
      adminUsers.map(admin =>
        this.createNotification({
          ...payload,
          userId: admin.id,
        })
      )
    );
  }

  async sendFinancialDirectorNotification(payload: {
    type: string;
    title: string;
    message: string;
    data: any;
  }): Promise<void> {
    // Get all financial director users only
    const financialDirectors = await this.prisma.user.findMany({
      where: {
        userRole: 'FINANCIAL_DIRECTOR',
      },
      select: {
        id: true,
      },
    });

    // Create notification for each financial director
    await Promise.all(
      financialDirectors.map(fd =>
        this.createNotification({
          ...payload,
          userId: fd.id,
        })
      )
    );
  }
}
