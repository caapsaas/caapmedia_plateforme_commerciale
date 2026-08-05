import { Controller, Sse, UseGuards, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from 'src/common/auth/jwt/jwt.guard';
import { CurrentUser } from 'src/common/auth/role/role.decorator';
import type { JwtUser } from 'src/common/auth/jwt/jwt-user.interface';
import { NotificationsSseService } from './notifications-sse.service';

/**
 * Flux temps réel des notifications — authentifié par le même cookie httpOnly
 * que le reste de l'API (`EventSource(url, { withCredentials: true })` côté
 * frontend), pas de token en query string : contrairement à un JWT porté en
 * Bearer, le cookie part automatiquement avec la requête EventSource.
 */
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsSseController {
  constructor(private readonly sse: NotificationsSseService) {}

  @Sse('sse')
  stream(@CurrentUser() user: JwtUser): Observable<MessageEvent> {
    return this.sse.subscribe(user.id);
  }
}
