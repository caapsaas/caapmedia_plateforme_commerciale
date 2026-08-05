import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { CurrentUser } from 'src/common/auth/role/role.decorator';
import type { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(
    @CurrentUser() user: JwtUser,
    @Query() paginationQuery: PaginationQueryDto,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.notificationsService.getUserNotifications(
      user.id,
      user.activeRole,
      unreadOnly === 'true',
      paginationQuery,
    );
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: JwtUser) {
    return this.notificationsService.getUnreadCount(user.id, user.activeRole);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Patch('read-all')
  markAllAsRead(@CurrentUser() user: JwtUser) {
    return this.notificationsService.markAllAsRead(user.id, user.activeRole);
  }
}
