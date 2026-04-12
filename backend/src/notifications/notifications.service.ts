import { Injectable, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { PrismaService } from '../common/utils/prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationType, RecipientType } from './types/notification.types';
import type { NotificationData, CreateNotificationData } from './types/notification.types';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsGateway))
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

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
        OR: [
          {
            recipientId: userId,
            recipientType: RecipientType.USER,
          },
          {
            userId: userId, // Pour la compatibilité avec l'ancien modèle
          },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to 50 most recent notifications
    });

    return notifications.map(notification => ({
      id: notification.id,
      type: notification.type as NotificationType,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      read: notification.read,
      createdAt: notification.createdAt.toISOString(),
      orderId: (notification as any).orderId,
      recipientId: (notification as any).recipientId,
      recipientType: (notification as any).recipientType as RecipientType,
    }));
  }

  async getUnreadNotificationsCount(userId: string): Promise<number> {
    const count = await this.prisma.notification.count({
      where: {
        OR: [
          {
            recipientId: userId,
            recipientType: RecipientType.USER,
            read: false,
          },
          {
            userId: userId, // Pour la compatibilité
            read: false,
          },
        ],
      },
    });

    return count;
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    const result = await this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        OR: [
          {
            recipientId: userId,
            recipientType: RecipientType.USER,
          },
          {
            userId: userId, // Pour la compatibilité
          },
        ],
      },
      data: {
        read: true,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Notification not found or access denied');
    }
  }

  async createNotification(data: CreateNotificationData): Promise<NotificationData> {
    const notification = await this.prisma.notification.create({
      data: {
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data,
        recipientId: data.recipientId,
        recipientType: data.recipientType,
        orderId: data.orderId,
      },
    });

    const notificationData: NotificationData = {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      read: notification.read,
      createdAt: notification.createdAt.toISOString(),
      orderId: notification.orderId || undefined,
      recipientId: notification.recipientId,
      recipientType: notification.recipientType,
    };

    // Envoyer la notification en temps réel
    if (data.recipientType === RecipientType.USER) {
      await this.notificationsGateway.notifyUser(data.recipientId, notificationData);
    } else if (data.recipientType === RecipientType.CLIENT) {
      await this.notificationsGateway.notifyClient(data.recipientId, notificationData);
    }

    return notificationData;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: {
        OR: [
          {
            recipientId: userId,
            recipientType: RecipientType.USER,
          },
          {
            userId: userId, // Pour la compatibilité
          },
        ],
      },
      data: {
        read: true,
      },
    });
  }

  // Méthodes de notification spécifiques

  async notifyUser(userId: string, data: Omit<CreateNotificationData, 'recipientId' | 'recipientType'>): Promise<NotificationData> {
    return this.createNotification({
      ...data,
      recipientId: userId,
      recipientType: RecipientType.USER,
    });
  }

  async notifyClient(clientId: string, data: Omit<CreateNotificationData, 'recipientId' | 'recipientType'>): Promise<NotificationData> {
    return this.createNotification({
      ...data,
      recipientId: clientId,
      recipientType: RecipientType.CLIENT,
    });
  }

  
  async sendAdminNotification(payload: {
    type: NotificationType;
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
          recipientId: admin.id,
          recipientType: RecipientType.USER,
        })
      )
    );
  }

  async notifyAdminsOnly(payload: {
    type: NotificationType;
    title: string;
    message: string;
    data: any;
  }): Promise<void> {
    // Get only admin users
    const adminUsers = await this.prisma.user.findMany({
      where: {
        userRole: 'ADMIN',
      },
      select: {
        id: true,
      },
    });

    // Create notification for each admin only
    await Promise.all(
      adminUsers.map(admin =>
        this.createNotification({
          ...payload,
          recipientId: admin.id,
          recipientType: RecipientType.USER,
        })
      )
    );
  }

  async sendFinancialDirectorNotification(payload: {
    type: NotificationType;
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
          recipientId: fd.id,
          recipientType: RecipientType.USER,
        })
      )
    );
  }

  async sendEmailToNalobert(payload: {
    to: string;
    subject: string;
    message: string;
    transactionData: any;
  }): Promise<void> {
    try {
      // Configuration du transporteur SMTP (à adapter selon votre configuration)
      const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'ssmtp.ethereal.email',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER || 'ornellatiako730@gmail.com',
          pass: process.env.SMTP_PASS || 'qapogsvfcfmvyodb',
        },
      });

      const mailOptions = {
        from: process.env.SMTP_FROM || '"Système Financier" <noreply@caapmedia.com>',
        to: payload.to,
        subject: payload.subject,
        text: payload.message,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
              <h2 style="color: #333; margin-bottom: 20px;">${payload.subject}</h2>
              <div style="background-color: white; padding: 20px; border-radius: 6px; border-left: 4px solid #007bff;">
                ${payload.message.replace(/\n/g, '<br>')}
              </div>
              <div style="margin-top: 20px; padding: 15px; background-color: #e9ecef; border-radius: 6px;">
                <p style="margin: 0; font-size: 12px; color: #6c757d;">
                  <strong>Détails techniques:</strong><br>
                  ID Transaction: ${payload.transactionData?.id || 'N/A'}<br>
                  Date: ${new Date().toLocaleString('fr-FR')}<br>
                  Système: CAAP Media Platform
                </p>
              </div>
            </div>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${payload.to}`);
    } catch (error) {
      console.error('Error sending email to nalobert:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async notifySubsidiaryCommercial(subsidiaryId: string, data: Omit<CreateNotificationData, 'recipientId' | 'recipientType'>): Promise<void> {
    // Récupérer tous les commerciaux de la filiale
    const commercials = await this.prisma.user.findMany({
      where: {
        subsidiaryId: subsidiaryId,
        userRole: {
          in: ['COMMERCIAL', 'SALES_REPRESENTATIVE'] as any[],
        },
      },
      select: {
        id: true,
      },
    });

    // Créer une notification pour chaque commercial
    const notifications = await Promise.all(
      commercials.map(commercial =>
        this.createNotification({
          ...data,
          recipientId: commercial.id,
          recipientType: RecipientType.USER,
        })
      )
    );

    // Envoyer les notifications temps réel
    for (const notification of notifications) {
      await this.notificationsGateway.notifySubsidiaryCommercial(subsidiaryId, notification);
    }
  }

  async notifyAll(data: Omit<CreateNotificationData, 'recipientId' | 'recipientType'>): Promise<void> {
    // Récupérer tous les utilisateurs
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
      },
    });

    // Créer une notification pour chaque utilisateur
    await Promise.all(
      users.map(user =>
        this.createNotification({
          ...data,
          recipientId: user.id,
          recipientType: RecipientType.USER,
        })
      )
    );

    // Broadcast temps réel
    await this.notificationsGateway.notifyAll(data);
  }

  // Méthodes d'intégration métier

  async notifyNewOrder(orderId: string, customerId: string, subsidiaryId: string): Promise<void> {
    // Notifier le commercial assigné
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        salesRep: true,
        customer: true,
      },
    });

    if (order?.salesRep) {
      await this.notifyUser(order.salesRep.id, {
        type: NotificationType.NEW_ORDER,
        title: 'Nouvelle commande',
        message: `Nouvelle commande de ${order.customerName} pour un montant de ${this.formatAmount(Number(order.totalAmount))}`,
        data: {
          orderId: order.id,
          customerId: order.customerId,
          totalAmount: order.totalAmount,
        },
        orderId: order.id,
      });
    }

    // Notifier tous les commerciaux de la filiale
    await this.notifySubsidiaryCommercial(subsidiaryId, {
      type: NotificationType.NEW_ORDER,
      title: 'Nouvelle commande dans votre filiale',
      message: `Une nouvelle commande de ${order?.customerName} a été enregistrée`,
      data: {
        orderId: order?.id,
        customerId: order?.customerId,
        totalAmount: order?.totalAmount,
      },
      orderId: order?.id,
    });
  }

  async notifyOrderStatusChange(orderId: string, newStatus: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        salesRep: true,
        customer: true,
      },
    });

    if (!order) return;

    const statusMessages: Record<string, string> = {
      'PENDING': 'En attente de validation',
      'CONFIRMED': 'Commande confirmée',
      'IN_PRODUCTION': 'En production',
      'READY': 'Prête pour livraison',
      'DELIVERED': 'Livrée',
      'CANCELLED': 'Annulée',
    };

    const message = statusMessages[newStatus] || `Statut mis à jour: ${newStatus}`;

    // Notifier le commercial
    if (order.salesRep) {
      await this.notifyUser(order.salesRep.id, {
        type: NotificationType.ORDER_STATUS,
        title: 'Changement de statut de commande',
        message: `La commande ${order.customerName} est maintenant: ${message}`,
        data: {
          orderId: order.id,
          oldStatus: order.status,
          newStatus: newStatus,
        },
        orderId: order.id,
      });
    }

    // Notifier le client
    await this.notifyClient(order.customerId, {
      type: NotificationType.ORDER_STATUS,
      title: 'Votre commande a été mise à jour',
      message: `Votre commande est maintenant: ${message}`,
      data: {
        orderId: order.id,
        newStatus: newStatus,
      },
      orderId: order.id,
    });
  }

  async notifyPaymentReceived(orderId: string, amount: number): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        salesRep: true,
        customer: true,
      },
    });

    if (!order) return;

    // Notifier le commercial
    if (order.salesRep) {
      await this.notifyUser(order.salesRep.id, {
        type: NotificationType.PAYMENT_RECEIVED,
        title: 'Paiement reçu',
        message: `Paiement de ${this.formatAmount(amount)} reçu pour la commande de ${order.customerName}`,
        data: {
          orderId: order.id,
          amount: amount,
          totalAmount: order.totalAmount,
        },
        orderId: order.id,
      });
    }

    // Notifier les directeurs financiers
    await this.sendFinancialDirectorNotification({
      type: NotificationType.PAYMENT_RECEIVED,
      title: 'Nouveau paiement reçu',
      message: `Paiement de ${this.formatAmount(amount)} pour la commande ${order.customerName}`,
      data: {
        orderId: order.id,
        amount: amount,
        customerId: order.customerId,
      },
    });
  }

  async notifyLowStock(productId: string, currentStock: number, threshold: number): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        subsidiary: true,
      },
    });

    if (!product) return;

    // Notifier les responsables de stock et administrateurs de la filiale
    const stockManagers = await this.prisma.user.findMany({
      where: {
        subsidiaryId: product.subsidiaryId,
        userRole: {
          in: ['ADMIN', 'STOCK_MANAGER'] as any[],
        },
      },
      select: {
        id: true,
      },
    });

    await Promise.all(
      stockManagers.map(manager =>
        this.notifyUser(manager.id, {
          type: NotificationType.LOW_STOCK,
          title: 'Stock faible',
          message: `Le produit ${product.productName} n'a plus que ${currentStock} unités en stock (seuil: ${threshold})`,
          data: {
            productId: product.id,
            productName: product.productName,
            currentStock: currentStock,
            threshold: threshold,
          },
        })
      )
    );
  }

  async notifySystemAlert(message: string, data?: any): Promise<void> {
    // Notifier tous les administrateurs
    await this.sendAdminNotification({
      type: NotificationType.SYSTEM_ALERT,
      title: 'Alerte Système',
      message: message,
      data: data,
    });
  }
}
