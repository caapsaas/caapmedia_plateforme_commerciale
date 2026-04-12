import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, forwardRef, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NotificationsService } from './notifications.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('NotificationsGateway');

  constructor(
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('Notifications Gateway initialized');
  }

  async handleConnection(client: Socket, ...args: any[]) {
    try {
      // Authentification via JWT token
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;
      const subsidiaryId = payload.subsidiaryId;

      // Rejoindre les salles appropriées
      await client.join(`user-${userId}`);
      await client.join(`subsidiary-${subsidiaryId}`);

      // Stocker les infos utilisateur dans le client
      client.data.userId = userId;
      client.data.subsidiaryId = subsidiaryId;
      client.data.userRole = payload.userRole;

      this.logger.log(`Client ${client.id} connected for user ${userId}`);

      // Envoyer le compteur de notifications non lues
      const unreadCount = await this.notificationsService.getUnreadNotificationsCount(userId);
      client.emit('unread-count', unreadCount);

    } catch (error) {
      this.logger.error(`Authentication failed for client ${client.id}:`, error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client ${client.id} disconnected`);
  }

  @SubscribeMessage('mark-read')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationId: string },
  ) {
    try {
      const userId = client.data.userId;
      if (!userId) {
        client.emit('error', { message: 'Unauthorized' });
        return;
      }

      await this.notificationsService.markNotificationAsRead(data.notificationId, userId);
      
      // Envoyer le nouveau compteur de notifications non lues
      const unreadCount = await this.notificationsService.getUnreadNotificationsCount(userId);
      client.emit('unread-count', unreadCount);
      
      client.emit('notification-marked-read', { notificationId: data.notificationId });
    } catch (error) {
      this.logger.error('Error marking notification as read:', error);
      client.emit('error', { message: 'Failed to mark notification as read' });
    }
  }

  @SubscribeMessage('mark-all-read')
  async handleMarkAllAsRead(@ConnectedSocket() client: Socket) {
    try {
      const userId = client.data.userId;
      if (!userId) {
        client.emit('error', { message: 'Unauthorized' });
        return;
      }

      await this.notificationsService.markAllNotificationsAsRead(userId);
      
      // Envoyer le nouveau compteur
      client.emit('unread-count', 0);
      client.emit('all-notifications-marked-read');
    } catch (error) {
      this.logger.error('Error marking all notifications as read:', error);
      client.emit('error', { message: 'Failed to mark all notifications as read' });
    }
  }

  // Méthodes pour envoyer des notifications temps réel
  async notifyUser(userId: string, notification: any) {
    this.server.to(`user-${userId}`).emit('notification', notification);
    this.logger.log(`Notification sent to user ${userId}`);
  }

  async notifyClient(clientId: string, notification: any) {
    this.server.to(`client-${clientId}`).emit('notification', notification);
    this.logger.log(`Notification sent to client ${clientId}`);
  }

  async notifySubsidiaryCommercial(subsidiaryId: string, notification: any) {
    this.server.to(`subsidiary-${subsidiaryId}`).emit('notification', notification);
    this.logger.log(`Notification sent to subsidiary ${subsidiaryId} commercials`);
  }

  async notifyAll(payload: any) {
    this.server.emit('notification', payload);
    this.logger.log('Broadcast notification sent to all clients');
  }

  async updateUnreadCount(userId: string, count: number) {
    this.server.to(`user-${userId}`).emit('unread-count', count);
  }
}
