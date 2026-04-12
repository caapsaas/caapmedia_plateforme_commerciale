import { Controller, Get, Patch, Param, UseGuards, Request, Post, Body, Delete, NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/auth/jwt/jwt.guard';
import { NotificationType, RecipientType } from './types/notification.types';
import type { CreateNotificationData } from './types/notification.types';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('user')
  async getUserNotifications(@Request() req) {
    return this.notificationsService.getUserNotifications(req.user.id);
  }

  @Get('unread-count')
  async getUnreadNotificationsCount(@Request() req) {
    return this.notificationsService.getUnreadNotificationsCount(req.user.id);
  }

  @Patch(':id/read')
  async markNotificationAsRead(@Param('id') id: string, @Request() req) {
    return this.notificationsService.markNotificationAsRead(id, req.user.id);
  }

  @Post('admin')
  async sendAdminNotification(@Body() payload: {
    type: NotificationType;
    title: string;
    message: string;
    data: any;
  }) {
    return this.notificationsService.sendAdminNotification(payload);
  }

  @Post('financial-director')
  async sendFinancialDirectorNotification(@Body() payload: {
    type: NotificationType;
    title: string;
    message: string;
    data: any;
  }) {
    return this.notificationsService.sendFinancialDirectorNotification(payload);
  }

  @Patch('read-all')
  async markAllNotificationsAsRead(@Request() req) {
    return this.notificationsService.markAllNotificationsAsRead(req.user.id);
  }

  @Post('create')
  async createNotification(@Body() data: CreateNotificationData) {
    return this.notificationsService.createNotification(data);
  }

  @Post('notify-user/:userId')
  async notifyUser(
    @Param('userId') userId: string,
    @Body() data: Omit<CreateNotificationData, 'recipientId' | 'recipientType'>,
  ) {
    return this.notificationsService.notifyUser(userId, data);
  }

  @Post('notify-client/:clientId')
  async notifyClient(
    @Param('clientId') clientId: string,
    @Body() data: Omit<CreateNotificationData, 'recipientId' | 'recipientType'>,
  ) {
    return this.notificationsService.notifyClient(clientId, data);
  }

  @Post('notify-subsidiary/:subsidiaryId')
  async notifySubsidiaryCommercial(
    @Param('subsidiaryId') subsidiaryId: string,
    @Body() data: Omit<CreateNotificationData, 'recipientId' | 'recipientType'>,
  ) {
    return this.notificationsService.notifySubsidiaryCommercial(subsidiaryId, data);
  }

  @Post('notify-all')
  async notifyAll(@Body() data: Omit<CreateNotificationData, 'recipientId' | 'recipientType'>) {
    return this.notificationsService.notifyAll(data);
  }

  @Post('notify-admins-only')
  async notifyAdminsOnly(@Body() payload: {
    type: NotificationType;
    title: string;
    message: string;
    data: any;
  }) {
    return this.notificationsService.notifyAdminsOnly(payload);
  }

  // Endpoints d'intégration métier
  @Post('new-order/:orderId')
  async notifyNewOrder(
    @Param('orderId') orderId: string,
    @Body() body: { customerId: string; subsidiaryId: string },
  ) {
    return this.notificationsService.notifyNewOrder(orderId, body.customerId, body.subsidiaryId);
  }

  @Post('order-status/:orderId')
  async notifyOrderStatusChange(
    @Param('orderId') orderId: string,
    @Body() body: { newStatus: string },
  ) {
    return this.notificationsService.notifyOrderStatusChange(orderId, body.newStatus);
  }

  @Post('payment-received/:orderId')
  async notifyPaymentReceived(
    @Param('orderId') orderId: string,
    @Body() body: { amount: number },
  ) {
    return this.notificationsService.notifyPaymentReceived(orderId, body.amount);
  }

  @Post('low-stock/:productId')
  async notifyLowStock(
    @Param('productId') productId: string,
    @Body() body: { currentStock: number; threshold: number },
  ) {
    return this.notificationsService.notifyLowStock(productId, body.currentStock, body.threshold);
  }

  @Post('system-alert')
  async notifySystemAlert(@Body() body: { message: string; data?: any }) {
    return this.notificationsService.notifySystemAlert(body.message, body.data);
  }

  @Delete(':id')
  async deleteNotification(@Param('id') id: string, @Request() req) {
    // Vérifier que l'utilisateur peut supprimer cette notification
    const notification = await this.notificationsService['prisma'].notification.findFirst({
      where: {
        id: id,
        OR: [
          {
            recipientId: req.user.id,
            recipientType: RecipientType.USER,
          },
          {
            userId: req.user.id, // Pour la compatibilité
          },
        ],
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found or access denied');
    }

    await this.notificationsService['prisma'].notification.delete({
      where: { id: id },
    });

    return { message: 'Notification deleted successfully' };
  }
}
