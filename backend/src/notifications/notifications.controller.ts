import { Controller, Get, Patch, Param, UseGuards, Request, Post, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/auth/jwt/jwt.guard';

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
    type: string;
    title: string;
    message: string;
    data: any;
  }) {
    return this.notificationsService.sendAdminNotification(payload);
  }

  @Post('financial-director')
  async sendFinancialDirectorNotification(@Body() payload: {
    type: string;
    title: string;
    message: string;
    data: any;
  }) {
    return this.notificationsService.sendFinancialDirectorNotification(payload);
  }
}
