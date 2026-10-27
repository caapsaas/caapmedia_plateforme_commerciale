import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, Subject, merge, interval, map, filter } from 'rxjs';
import { UserRole } from '@prisma/client';

/**
 * Diffusion temps réel des notifications — un flux RxJS par utilisateur
 * connecté (`Subject`), poussé par `NotificationsService` à la création
 * d'une notification. Le heartbeat garde la connexion HTTP ouverte à travers
 * d'éventuels proxys/reverse-proxys qui coupent les connexions idle.
 */
@Injectable()
export class NotificationsSseService {
  private readonly streams = new Map<string, Subject<MessageEvent>>();

  private getOrCreateStream(userId: string): Subject<MessageEvent> {
    let stream = this.streams.get(userId);
    if (!stream) {
      stream = new Subject<MessageEvent>();
      this.streams.set(userId, stream);
    }
    return stream;
  }

  subscribe(userId: string, activeRole: UserRole): Observable<MessageEvent> {
    const heartbeat = interval(30_000).pipe(
      map((): MessageEvent => ({ type: 'heartbeat', data: {} })),
    );
    const notifications = this.getOrCreateStream(userId).pipe(
      filter((event) => {
        const { targetRole } = event.data as { targetRole?: UserRole | null };
        return targetRole == null || targetRole === activeRole;
      }),
    );
    return merge(notifications, heartbeat);
  }

  push(userId: string, notification: object): void {
    this.streams
      .get(userId)
      ?.next({ type: 'notification', data: notification });
  }

  pushToUsers(userIds: string[], notification: object): void {
    for (const userId of userIds) this.push(userId, notification);
  }
}
